import long_term_occupant_model from "../../models/occupancy/long_term_occupant.model.js";
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

/* ================= GET ALL LONG TERM OCCUPANTS ================= */
export const handle_get_long_term_occupants = async (req, res) => {
  try {
    const occupants = await long_term_occupant_model
      .find()
      .populate("tenant")
      .populate("property")
      .populate("unit");

    return res.status(200).json({
      status: "success",
      message: "Long term occupants fetched successfully",
      data: occupants,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching long term occupants",
      error: error.message,
    });
  }
};

/* ================= GET LONG TERM OCCUPANT BY ID ================= */
export const handle_get_long_term_occupant = async (req, res) => {
  try {
    const { occupant_id } = req.params;

    const occupant = await long_term_occupant_model
      .findById(occupant_id)
      .populate("tenant")
      .populate("property")
      .populate("unit");

    if (!occupant) {
      return res.status(404).json({
        status: "error",
        message: "Long term occupant not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Long term occupant fetched successfully",
      data: occupant,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching long term occupant",
      error: error.message,
    });
  }
};

/* ================= ADD LONG TERM OCCUPANT ================= */
export const handle_add_long_term_occupant = async (req, res) => {
  try {
    const {
      personal_info,
      contact_info,
      social_media,
      relationship_details,
      stay_info,
      employment_info,
      emergency_contact,
      health_info,
      tenant,
      property,
      unit,
    } = req.body;

    const rawPayload = {
      personal_info:        JSON.parse(personal_info        || "{}"),
      contact_info:         JSON.parse(contact_info         || "{}"),
      social_media:         JSON.parse(social_media         || "{}"),
      relationship_details: JSON.parse(relationship_details || "{}"),
      stay_info:            JSON.parse(stay_info            || "{}"),
      employment_info:      JSON.parse(employment_info      || "{}"),
      emergency_contact:    JSON.parse(emergency_contact    || "{}"),
      health_info:          JSON.parse(health_info          || "{}"),
      tenant,
      property,
      unit,
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const occupant = await long_term_occupant_model.create({
      ...cleanedPayload,
      personal_info: {
        ...cleanedPayload.personal_info,
        profile_image:     null,
        profile_image_key: null,
      },
      documents: {
        government_id:          null,
        government_id_key:      null,
        proof_of_income:        null,
        proof_of_income_key:    null,
        health_certificate:     null,
        health_certificate_key: null,
      },
      request_status: "pending",
    });

    /* -------- FILE UPLOADS -------- */
    const files = req.files || {};
    const id    = occupant._id.toString();

    // Profile image
    const profileImageFile = files.profile_image?.[0];
    if (profileImageFile) {
      const key      = build_s3_key("long_term_occupant", id, "profile_image", profileImageFile.filename);
      const uploaded = await upload_file_to_s3(profileImageFile, key);
      occupant.personal_info.profile_image     = uploaded.url;
      occupant.personal_info.profile_image_key = uploaded.key;
    }

    // Government ID
    const governmentIdFile = files.government_id?.[0];
    if (governmentIdFile) {
      const key      = build_s3_key("long_term_occupant", id, "documents", governmentIdFile.filename);
      const uploaded = await upload_file_to_s3(governmentIdFile, key);
      occupant.documents.government_id     = uploaded.url;
      occupant.documents.government_id_key = uploaded.key;
    }

    // Proof of income
    const proofOfIncomeFile = files.proof_of_income?.[0];
    if (proofOfIncomeFile) {
      const key      = build_s3_key("long_term_occupant", id, "documents", proofOfIncomeFile.filename);
      const uploaded = await upload_file_to_s3(proofOfIncomeFile, key);
      occupant.documents.proof_of_income     = uploaded.url;
      occupant.documents.proof_of_income_key = uploaded.key;
    }

    // Health certificate
    const healthCertFile = files.health_certificate?.[0];
    if (healthCertFile) {
      const key      = build_s3_key("long_term_occupant", id, "documents", healthCertFile.filename);
      const uploaded = await upload_file_to_s3(healthCertFile, key);
      occupant.documents.health_certificate     = uploaded.url;
      occupant.documents.health_certificate_key = uploaded.key;
    }

    await occupant.save();
    clear_temp_files(req.files);

    return res.status(201).json({
      status: "success",
      message: "Long term occupant added successfully",
      data: occupant,
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding long term occupant",
      error: error.message,
    });
  }
};

/* ================= EDIT LONG TERM OCCUPANT ================= */
export const handle_edit_long_term_occupant = async (req, res) => {
  try {
    const { occupant_id } = req.params;

    const occupant = await long_term_occupant_model.findById(occupant_id);
    if (!occupant) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Long term occupant not found",
      });
    }

    const {
      personal_info,
      contact_info,
      social_media,
      relationship_details,
      stay_info,
      employment_info,
      emergency_contact,
      health_info,
      tenant,
      property,
      unit,
      request_status,
    } = req.body;

    const rawPayload = {
      personal_info:        JSON.parse(personal_info        || "{}"),
      contact_info:         JSON.parse(contact_info         || "{}"),
      social_media:         JSON.parse(social_media         || "{}"),
      relationship_details: JSON.parse(relationship_details || "{}"),
      stay_info:            JSON.parse(stay_info            || "{}"),
      employment_info:      JSON.parse(employment_info      || "{}"),
      emergency_contact:    JSON.parse(emergency_contact    || "{}"),
      health_info:          JSON.parse(health_info          || "{}"),
      tenant,
      property,
      unit,
      request_status,
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    /* -------- FILE UPLOADS -------- */
    const files = req.files || {};
    const id    = occupant._id.toString();

    // Profile image
    const profileImageFile = files.profile_image?.[0];
    if (profileImageFile) {
      if (occupant.personal_info?.profile_image_key) {
        await delete_file_from_s3(occupant.personal_info.profile_image_key);
      }
      const key      = build_s3_key("long_term_occupant", id, "profile_image", profileImageFile.filename);
      const uploaded = await upload_file_to_s3(profileImageFile, key);
      if (!cleanedPayload.personal_info) cleanedPayload.personal_info = {};
      cleanedPayload.personal_info.profile_image     = uploaded.url;
      cleanedPayload.personal_info.profile_image_key = uploaded.key;
    }

    // Government ID
    const governmentIdFile = files.government_id?.[0];
    if (governmentIdFile) {
      if (occupant.documents?.government_id_key) {
        await delete_file_from_s3(occupant.documents.government_id_key);
      }
      const key      = build_s3_key("long_term_occupant", id, "documents", governmentIdFile.filename);
      const uploaded = await upload_file_to_s3(governmentIdFile, key);
      cleanedPayload["documents.government_id"]     = uploaded.url;
      cleanedPayload["documents.government_id_key"] = uploaded.key;
    }

    // Proof of income
    const proofOfIncomeFile = files.proof_of_income?.[0];
    if (proofOfIncomeFile) {
      if (occupant.documents?.proof_of_income_key) {
        await delete_file_from_s3(occupant.documents.proof_of_income_key);
      }
      const key      = build_s3_key("long_term_occupant", id, "documents", proofOfIncomeFile.filename);
      const uploaded = await upload_file_to_s3(proofOfIncomeFile, key);
      cleanedPayload["documents.proof_of_income"]     = uploaded.url;
      cleanedPayload["documents.proof_of_income_key"] = uploaded.key;
    }

    // Health certificate
    const healthCertFile = files.health_certificate?.[0];
    if (healthCertFile) {
      if (occupant.documents?.health_certificate_key) {
        await delete_file_from_s3(occupant.documents.health_certificate_key);
      }
      const key      = build_s3_key("long_term_occupant", id, "documents", healthCertFile.filename);
      const uploaded = await upload_file_to_s3(healthCertFile, key);
      cleanedPayload["documents.health_certificate"]     = uploaded.url;
      cleanedPayload["documents.health_certificate_key"] = uploaded.key;
    }

    const updated_occupant = await long_term_occupant_model.findByIdAndUpdate(
      occupant_id,
      { $set: cleanedPayload },
      { new: true },
    );

    clear_temp_files(req.files);

    return res.status(200).json({
      status: "success",
      message: "Long term occupant updated successfully",
      data: updated_occupant,
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating long term occupant",
      error: error.message,
    });
  }
};

/* ================= DELETE LONG TERM OCCUPANT ================= */
export const handle_delete_long_term_occupant = async (req, res) => {
  try {
    const { occupant_id } = req.params;

    const occupant = await long_term_occupant_model.findById(occupant_id);
    if (!occupant) {
      return res.status(404).json({
        status: "error",
        message: "Long term occupant not found",
      });
    }

    // Delete all S3 files
    if (occupant.personal_info?.profile_image_key) {
      await delete_file_from_s3(occupant.personal_info.profile_image_key);
    }
    if (occupant.documents?.government_id_key) {
      await delete_file_from_s3(occupant.documents.government_id_key);
    }
    if (occupant.documents?.proof_of_income_key) {
      await delete_file_from_s3(occupant.documents.proof_of_income_key);
    }
    if (occupant.documents?.health_certificate_key) {
      await delete_file_from_s3(occupant.documents.health_certificate_key);
    }

    await long_term_occupant_model.findByIdAndDelete(occupant_id);

    return res.status(200).json({
      status: "success",
      message: "Long term occupant deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting long term occupant",
      error: error.message,
    });
  }
};

/* ================= UPDATE REQUEST STATUS ================= */
export const handle_update_long_term_occupant_status = async (req, res) => {
  try {
    const { occupant_id } = req.params;
    const { request_status } = req.body;

    const allowed_statuses = ["pending", "approved", "rejected", "cancelled"];
    if (!request_status || !allowed_statuses.includes(request_status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status. Allowed values: ${allowed_statuses.join(", ")}`,
      });
    }

    const occupant = await long_term_occupant_model.findByIdAndUpdate(
      occupant_id,
      { $set: { request_status } },
      { new: true },
    );

    if (!occupant) {
      return res.status(404).json({
        status: "error",
        message: "Long term occupant not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Request status updated successfully",
      data: { _id: occupant._id, request_status: occupant.request_status },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating request status",
      error: error.message,
    });
  }
};