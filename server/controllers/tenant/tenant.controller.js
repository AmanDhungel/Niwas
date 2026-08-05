import tenant_model from "../../models/tenant/tenant.model.js";
import {
  upload_file_to_s3,
  delete_file_from_s3,
  build_s3_key,
  clear_temp_files,
} from "../../utils/s3.util.js";

const isEmptyValue = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

const sanitizePayload = (payload) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!isEmptyValue(value)) cleaned[key] = value;
  }
  return cleaned;
};

/* ================= GET ALL TENANTS ================= */
export const handle_get_tenants = async (req, res) => {
  try {
    const tenants = await tenant_model
      .find()
      .populate("property_assignment.property")
      .populate("property_assignment.unit")
      .populate("property_assignment.deals")
      .populate("property_assignment.owner")
      .populate("visibility_settings.selected_people");

    return res.status(200).json({
      status: "success",
      message: "Tenants fetched successfully",
      data: tenants,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching tenants",
      error: error.message,
    });
  }
};

/* ================= GET TENANT BY ID ================= */
export const handle_get_tenant = async (req, res) => {
  try {
    const { tenant_id } = req.params;

    const tenant = await tenant_model
      .findById(tenant_id)
      .populate("property_assignment.property")
      .populate("property_assignment.unit")
      .populate("property_assignment.deals")
      .populate("property_assignment.owner")
      .populate("visibility_settings.selected_people");

    if (!tenant) {
      return res.status(404).json({
        status: "error",
        message: "Tenant not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Tenant fetched successfully",
      data: tenant,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching tenant",
      error: error.message,
    });
  }
};

/* ================= ADD TENANT ================= */
export const handle_add_tenant = async (req, res) => {
  try {
    const {
      basic_info,
      social_media,
      contact_info,
      address,
      employment,
      property_assignment,
      preferences,
      notifications,
      visibility_settings,
      additional_notes,
      status,
    } = req.body;

    const rawPayload = {
      basic_info: JSON.parse(basic_info || "{}"),
      social_media: JSON.parse(social_media || "{}"),
      contact_info: JSON.parse(contact_info || "{}"),
      address: JSON.parse(address || "{}"),
      employment: JSON.parse(employment || "{}"),
      property_assignment: JSON.parse(property_assignment || "{}"),
      preferences: JSON.parse(preferences || "{}"),
      notifications: JSON.parse(notifications || "{}"),
      visibility_settings: JSON.parse(visibility_settings || "{}"),
      additional_notes,
      status,
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    // Initialize profile_image as empty object — filled after upload
    if (!cleanedPayload.basic_info) cleanedPayload.basic_info = {};
    cleanedPayload.basic_info.profile_image = { url: null, key: null };

    const tenant = await tenant_model.create(cleanedPayload);

    /* -------- PROFILE IMAGE UPLOAD -------- */
    const profileImageFile = req.files?.profile_image?.[0];

    if (profileImageFile) {
      const key = build_s3_key(
        "tenant",
        tenant._id.toString(),
        "profile_image",
        profileImageFile.filename,
      );

      const uploaded = await upload_file_to_s3(profileImageFile, key);

      tenant.basic_info.profile_image = {
        url: uploaded.url,
        key: uploaded.key,
      };
      await tenant.save();
    }

    clear_temp_files(req.files);

    return res.status(201).json({
      status: "success",
      message: "Tenant added successfully",
      data: tenant,
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding tenant",
      error: error.message,
    });
  }
};

/* ================= EDIT TENANT ================= */
export const handle_edit_tenant = async (req, res) => {
  try {
    const { tenant_id } = req.params;

    const tenant = await tenant_model.findById(tenant_id);
    if (!tenant) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Tenant not found",
      });
    }

    const {
      basic_info,
      social_media,
      contact_info,
      address,
      employment,
      property_assignment,
      preferences,
      notifications,
      visibility_settings,
      additional_notes,
      status,
    } = req.body;

    const rawPayload = {
      basic_info: JSON.parse(basic_info || "{}"),
      social_media: JSON.parse(social_media || "{}"),
      contact_info: JSON.parse(contact_info || "{}"),
      address: JSON.parse(address || "{}"),
      employment: JSON.parse(employment || "{}"),
      property_assignment: JSON.parse(property_assignment || "{}"),
      preferences: JSON.parse(preferences || "{}"),
      notifications: JSON.parse(notifications || "{}"),
      visibility_settings: JSON.parse(visibility_settings || "{}"),
      additional_notes,
      status,
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    /* -------- PROFILE IMAGE UPLOAD -------- */
    const profileImageFile = req.files?.profile_image?.[0];

    if (profileImageFile) {
      // Delete old image from S3 if it exists
      const old_key = tenant.basic_info?.profile_image?.key;
      if (old_key) await delete_file_from_s3(old_key);

      const key = build_s3_key(
        "tenant",
        tenant._id.toString(),
        "profile_image",
        profileImageFile.filename,
      );

      const uploaded = await upload_file_to_s3(profileImageFile, key);

      if (!cleanedPayload.basic_info) cleanedPayload.basic_info = {};
      cleanedPayload.basic_info.profile_image = {
        url: uploaded.url,
        key: uploaded.key,
      };
    }

    const updated_tenant = await tenant_model.findByIdAndUpdate(
      tenant_id,
      { $set: cleanedPayload },
      { new: true },
    );

    clear_temp_files(req.files);

    return res.status(200).json({
      status: "success",
      message: "Tenant updated successfully",
      data: updated_tenant,
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating tenant",
      error: error.message,
    });
  }
};

/* ================= DELETE TENANT ================= */
export const handle_delete_tenant = async (req, res) => {
  try {
    const { tenant_id } = req.params;

    const tenant = await tenant_model.findById(tenant_id);
    if (!tenant) {
      return res.status(404).json({
        status: "error",
        message: "Tenant not found",
      });
    }

    // Delete profile image from S3 if exists
    const old_key = tenant.basic_info?.profile_image?.key;
    if (old_key) await delete_file_from_s3(old_key);

    await tenant_model.findByIdAndDelete(tenant_id);

    return res.status(200).json({
      status: "success",
      message: "Tenant deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting tenant",
      error: error.message,
    });
  }
};
