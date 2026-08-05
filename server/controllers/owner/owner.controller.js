import owner_model from "../../models/owner/owner.model.js";
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

/* ================= GET ALL OWNERS ================= */
export const handle_get_owners = async (req, res) => {
  try {
    const owners = await owner_model
      .find()
      .populate("basic_info.contacts")
      .populate("property_assignment.property")
      .populate("property_assignment.unit")
      .populate("property_assignment.deals")
      .populate("visibility_settings.selected_people");

    return res.status(200).json({
      status: "success",
      message: "Owners fetched successfully",
      data: owners,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching owners",
      error: error.message,
    });
  }
};

/* ================= GET OWNER BY ID ================= */
export const handle_get_owner = async (req, res) => {
  try {
    const { owner_id } = req.params;

    const owner = await owner_model
      .findById(owner_id)
      .populate("basic_info.contacts")
      .populate("property_assignment.property")
      .populate("property_assignment.unit")
      .populate("property_assignment.deals")
      .populate("visibility_settings.selected_people");

    if (!owner) {
      return res.status(404).json({
        status: "error",
        message: "Owner not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Owner fetched successfully",
      data: owner,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching owner",
      error: error.message,
    });
  }
};

/* ================= ADD OWNER ================= */
export const handle_add_owner = async (req, res) => {
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

    // Initialize profile_image as empty nested object — filled after upload
    if (!cleanedPayload.basic_info) cleanedPayload.basic_info = {};
    cleanedPayload.basic_info.profile_image = { url: null, key: null };

    const owner = await owner_model.create(cleanedPayload);

    /* -------- PROFILE IMAGE UPLOAD -------- */
    const files = req.files || {};
    const profileImageFile = files.profile_image?.[0];

    if (profileImageFile) {
      const key = build_s3_key(
        "owner",
        owner._id.toString(),
        "profile_image",
        profileImageFile.filename,
      );

      const uploaded = await upload_file_to_s3(profileImageFile, key);

      owner.basic_info.profile_image = { url: uploaded.url, key: uploaded.key };
      await owner.save();
    }

    clear_temp_files(req.files);

    return res.status(201).json({
      status: "success",
      message: "Owner added successfully",
      data: owner,
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding owner",
      error: error.message,
    });
  }
};

/* ================= EDIT OWNER ================= */
export const handle_edit_owner = async (req, res) => {
  try {
    const { owner_id } = req.params;

    const owner = await owner_model.findById(owner_id);
    if (!owner) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Owner not found",
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
    const files = req.files || {};
    const profileImageFile = files.profile_image?.[0];

    if (profileImageFile) {
      // Delete old image from S3 if exists
      const old_key = owner.basic_info?.profile_image?.key;
      if (old_key) await delete_file_from_s3(old_key);

      const key = build_s3_key(
        "owner",
        owner._id.toString(),
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

    const updated_owner = await owner_model.findByIdAndUpdate(
      owner_id,
      { $set: cleanedPayload },
      { new: true },
    );

    clear_temp_files(req.files);

    return res.status(200).json({
      status: "success",
      message: "Owner updated successfully",
      data: updated_owner,
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating owner",
      error: error.message,
    });
  }
};

/* ================= DELETE OWNER ================= */
export const handle_delete_owner = async (req, res) => {
  try {
    const { owner_id } = req.params;

    const owner = await owner_model.findById(owner_id);
    if (!owner) {
      return res.status(404).json({
        status: "error",
        message: "Owner not found",
      });
    }

    // Delete profile image from S3 if exists
    const old_key = owner.basic_info?.profile_image?.key;
    if (old_key) await delete_file_from_s3(old_key);

    await owner_model.findByIdAndDelete(owner_id);

    return res.status(200).json({
      status: "success",
      message: "Owner deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting owner",
      error: error.message,
    });
  }
};
