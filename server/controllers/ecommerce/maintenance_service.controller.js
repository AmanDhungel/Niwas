import jwt from "jsonwebtoken";
import user_model from "../../models/user.model.js";
import maintenance_service_model from "../../models/ecommerce/maintenance_service.model.js";
import {
  upload_file_to_s3,
  build_s3_key,
  clear_temp_files,
} from "../../utils/s3.util.js";

/* ================= HELPER ================= */
const get_ecommerce_user = async (req) => {
  const { user_token } = req.cookies;
  if (!user_token) return { user: null, user_id: null };

  try {
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    const user = await user_model.findOne({
      _id: user_id,
      user_type: "ecommerce_user",
      is_deleted: false,
      is_active: true,
    });

    return { user, user_id };
  } catch {
    return { user: null, user_id: null };
  }
};


/* ================= CREATE ================= */
export const handle_create_maintenance_service_request = async (req, res) => {
  try {
    const { user, user_id } = await get_ecommerce_user(req);
    if (!user) {
      clear_temp_files(req.files ?? []);
      return res.status(401).json({
        status: "error",
        message: "Unauthorized.",
      });
    }

    const {
      service_type,
      property,
      description,
      priority,
      preferred_service_date,
      contact_phone_number,
    } = req.body;

    if (!service_type) {
      clear_temp_files(req.files ?? []);
      return res.status(400).json({
        status: "error",
        message: "Service type is required.",
      });
    }

    const VALID_SERVICE_TYPES = ["scheduled", "recurring", "reported", "emergency"];
    if (!VALID_SERVICE_TYPES.includes(service_type)) {
      clear_temp_files(req.files ?? []);
      return res.status(400).json({
        status: "error",
        message: `Invalid service type. Allowed values: ${VALID_SERVICE_TYPES.join(", ")}.`,
      });
    }

    if (priority !== undefined) {
      const VALID_PRIORITIES = ["low", "medium", "high", "critical"];
      if (!VALID_PRIORITIES.includes(priority)) {
        clear_temp_files(req.files ?? []);
        return res.status(400).json({
          status: "error",
          message: `Invalid priority. Allowed values: ${VALID_PRIORITIES.join(", ")}.`,
        });
      }
    }

    // Upload photos if provided
    const uploaded_photos = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const key = build_s3_key(
          "ecommerce",
          "maintenance",
          user_id.toString(),
          file.filename,
        );
        const uploaded = await upload_file_to_s3(file, key);
        uploaded_photos.push({ key: uploaded.key, url: uploaded.url });
      }
    }

    const new_request = await maintenance_service_model.create({
      requestor: user_id,
      service_type,
      property,
      description,
      priority,
      preferred_service_date,
      contact_phone_number,
      photos: uploaded_photos,
    });

    return res.status(201).json({
      status: "success",
      message: "Maintenance service request created successfully.",
      data: new_request,
    });
  } catch (error) {
    clear_temp_files(req.files ?? []);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while creating maintenance service request.",
      error: error.message,
    });
  }
};


/* ================= GET USER REQUESTS ================= */
export const handle_get_user_maintenance_service_requests = async (req, res) => {
  try {
    const { user } = await get_ecommerce_user(req);
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized.",
      });
    }

    const requests = await maintenance_service_model
      .find({ requestor: user._id })
      .populate("property")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      message: "Maintenance service requests fetched successfully.",
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching maintenance service requests.",
      error: error.message,
    });
  }
};


/* ================= GET SINGLE REQUEST ================= */
export const handle_get_single_maintenance_service_request = async (req, res) => {
  try {
    const { user } = await get_ecommerce_user(req);
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized.",
      });
    }

    const { request_id } = req.params;

    const request = await maintenance_service_model
      .findOne({ _id: request_id, requestor: user._id })
      .populate("property");

    if (!request) {
      return res.status(404).json({
        status: "error",
        message: "Maintenance service request not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Maintenance service request fetched successfully.",
      data: request,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching maintenance service request.",
      error: error.message,
    });
  }
};