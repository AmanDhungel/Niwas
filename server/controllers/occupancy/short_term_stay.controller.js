import short_term_stay_model from "../../models/occupancy/short_term_stay.model.js";
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

/* ================= GET ALL SHORT TERM STAYS ================= */
export const handle_get_short_term_stays = async (req, res) => {
  try {
    const stays = await short_term_stay_model
      .find()
      .populate("tenant")
      .populate("property")
      .populate("unit");

    return res.status(200).json({
      status: "success",
      message: "Short term stays fetched successfully",
      data: stays,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching short term stays",
      error: error.message,
    });
  }
};

/* ================= GET SHORT TERM STAY BY ID ================= */
export const handle_get_short_term_stay = async (req, res) => {
  try {
    const { stay_id } = req.params;

    const stay = await short_term_stay_model
      .findById(stay_id)
      .populate("tenant")
      .populate("property")
      .populate("unit");

    if (!stay) {
      return res.status(404).json({
        status: "error",
        message: "Short term stay not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Short term stay fetched successfully",
      data: stay,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching short term stay",
      error: error.message,
    });
  }
};

/* ================= ADD SHORT TERM STAY ================= */
export const handle_add_short_term_stay = async (req, res) => {
  try {
    const {
      guest_info,
      social_media,
      identification,
      additional_guests,
      stay_details,
      special_requirements,
      emergency_contact,
      visit_info,
      agreement,
      tenant,
      property,
      unit,
    } = req.body;

    const rawPayload = {
      guest_info:           JSON.parse(guest_info           || "{}"),
      social_media:         JSON.parse(social_media         || "{}"),
      identification:       JSON.parse(identification       || "{}"),
      additional_guests:    JSON.parse(additional_guests    || "[]"),
      stay_details:         JSON.parse(stay_details         || "{}"),
      special_requirements: JSON.parse(special_requirements || "{}"),
      emergency_contact:    JSON.parse(emergency_contact    || "{}"),
      visit_info:           JSON.parse(visit_info           || "{}"),
      agreement:            JSON.parse(agreement            || "{}"),
      tenant,
      property,
      unit,
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const stay = await short_term_stay_model.create({
      ...cleanedPayload,
      guest_info: {
        ...cleanedPayload.guest_info,
        profile_image:     null,
        profile_image_key: null,
      },
      identification: {
        ...cleanedPayload.identification,
        id_document:     null,
        id_document_key: null,
      },
      additional_guests: cleanedPayload.additional_guests || [],
      agreement: {
        ...cleanedPayload.agreement,
        acknowledged_at: cleanedPayload.agreement?.policy_acknowledged
          ? new Date()
          : null,
      },
      request_status: "pending",
    });

    /* -------- FILE UPLOADS -------- */
    const files = req.files || {};

    // Profile image
    const profileImageFile = files.profile_image?.[0];
    if (profileImageFile) {
      const key = build_s3_key(
        "occupancy/short_term_stay",
        stay._id.toString(),
        "profile_image",
        profileImageFile.filename,
      );
      const uploaded = await upload_file_to_s3(profileImageFile, key);
      stay.guest_info.profile_image     = uploaded.url;
      stay.guest_info.profile_image_key = uploaded.key;
    }

    // Primary guest ID document
    const idDocumentFile = files.id_document?.[0];
    if (idDocumentFile) {
      const key = build_s3_key(
        "occupancy/short_term_stay",
        stay._id.toString(),
        "id_document",
        idDocumentFile.filename,
      );
      const uploaded = await upload_file_to_s3(idDocumentFile, key);
      stay.identification.id_document     = uploaded.url;
      stay.identification.id_document_key = uploaded.key;
    }

    // Additional guest documents
    const additionalGuestDocs = files.additional_guest_documents || [];
    if (additionalGuestDocs.length > 0) {
      const uploadedDocs = [];
      for (const file of additionalGuestDocs) {
        const key = build_s3_key(
          "occupancy/short_term_stay",
          stay._id.toString(),
          "additional_guest_documents",
          file.filename,
        );
        const uploaded = await upload_file_to_s3(file, key);
        uploadedDocs.push({
          id_document:     uploaded.url,
          id_document_key: uploaded.key,
        });
      }
      stay.additional_guests = uploadedDocs;
    }

    await stay.save();
    clear_temp_files(req.files);

    return res.status(201).json({
      status: "success",
      message: "Short term stay request submitted successfully",
      data: stay,
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while submitting short term stay request",
      error: error.message,
    });
  }
};

/* ================= EDIT SHORT TERM STAY ================= */
export const handle_edit_short_term_stay = async (req, res) => {
  try {
    const { stay_id } = req.params;

    const stay = await short_term_stay_model.findById(stay_id);
    if (!stay) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Short term stay not found",
      });
    }

    const {
      guest_info,
      social_media,
      identification,
      additional_guests,
      stay_details,
      special_requirements,
      emergency_contact,
      visit_info,
      agreement,
      tenant,
      property,
      unit,
      request_status,
    } = req.body;

    const rawPayload = {
      guest_info:           JSON.parse(guest_info           || "{}"),
      social_media:         JSON.parse(social_media         || "{}"),
      identification:       JSON.parse(identification       || "{}"),
      additional_guests:    JSON.parse(additional_guests    || "[]"),
      stay_details:         JSON.parse(stay_details         || "{}"),
      special_requirements: JSON.parse(special_requirements || "{}"),
      emergency_contact:    JSON.parse(emergency_contact    || "{}"),
      visit_info:           JSON.parse(visit_info           || "{}"),
      agreement:            JSON.parse(agreement            || "{}"),
      tenant,
      property,
      unit,
      request_status,
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    /* -------- FILE UPLOADS -------- */
    const files = req.files || {};

    // Profile image
    const profileImageFile = files.profile_image?.[0];
    if (profileImageFile) {
      if (stay.guest_info?.profile_image_key) {
        await delete_file_from_s3(stay.guest_info.profile_image_key);
      }
      const key = build_s3_key(
        "occupancy/short_term_stay",
        stay._id.toString(),
        "profile_image",
        profileImageFile.filename,
      );
      const uploaded = await upload_file_to_s3(profileImageFile, key);
      if (!cleanedPayload.guest_info) cleanedPayload.guest_info = {};
      cleanedPayload.guest_info.profile_image     = uploaded.url;
      cleanedPayload.guest_info.profile_image_key = uploaded.key;
    }

    // ID document
    const idDocumentFile = files.id_document?.[0];
    if (idDocumentFile) {
      if (stay.identification?.id_document_key) {
        await delete_file_from_s3(stay.identification.id_document_key);
      }
      const key = build_s3_key(
        "occupancy/short_term_stay",
        stay._id.toString(),
        "id_document",
        idDocumentFile.filename,
      );
      const uploaded = await upload_file_to_s3(idDocumentFile, key);
      if (!cleanedPayload.identification) cleanedPayload.identification = {};
      cleanedPayload.identification.id_document     = uploaded.url;
      cleanedPayload.identification.id_document_key = uploaded.key;
    }

    // Additional guest documents — delete old keys then upload new
    const additionalGuestDocs = files.additional_guest_documents || [];
    if (additionalGuestDocs.length > 0) {
      // Delete all existing additional guest doc files from S3
      for (const guest of stay.additional_guests || []) {
        if (guest.id_document_key) {
          await delete_file_from_s3(guest.id_document_key);
        }
      }

      const uploadedDocs = [];
      for (const file of additionalGuestDocs) {
        const key = build_s3_key(
          "occupancy/short_term_stay",
          stay._id.toString(),
          "additional_guest_documents",
          file.filename,
        );
        const uploaded = await upload_file_to_s3(file, key);
        uploadedDocs.push({
          id_document:     uploaded.url,
          id_document_key: uploaded.key,
        });
      }
      cleanedPayload.additional_guests = uploadedDocs;
    }

    const updated_stay = await short_term_stay_model.findByIdAndUpdate(
      stay_id,
      { $set: cleanedPayload },
      { new: true },
    );

    clear_temp_files(req.files);

    return res.status(200).json({
      status: "success",
      message: "Short term stay updated successfully",
      data: updated_stay,
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating short term stay",
      error: error.message,
    });
  }
};

/* ================= DELETE SHORT TERM STAY ================= */
export const handle_delete_short_term_stay = async (req, res) => {
  try {
    const { stay_id } = req.params;

    const stay = await short_term_stay_model.findById(stay_id);
    if (!stay) {
      return res.status(404).json({
        status: "error",
        message: "Short term stay not found",
      });
    }

    // Delete all S3 files for this stay
    if (stay.guest_info?.profile_image_key) {
      await delete_file_from_s3(stay.guest_info.profile_image_key);
    }
    if (stay.identification?.id_document_key) {
      await delete_file_from_s3(stay.identification.id_document_key);
    }
    for (const guest of stay.additional_guests || []) {
      if (guest.id_document_key) {
        await delete_file_from_s3(guest.id_document_key);
      }
    }

    await short_term_stay_model.findByIdAndDelete(stay_id);

    return res.status(200).json({
      status: "success",
      message: "Short term stay deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting short term stay",
      error: error.message,
    });
  }
};

/* ================= UPDATE REQUEST STATUS ================= */
export const handle_update_short_term_stay_status = async (req, res) => {
  try {
    const { stay_id } = req.params;
    const { request_status } = req.body;

    const allowed_statuses = ["pending", "approved", "rejected", "cancelled"];
    if (!request_status || !allowed_statuses.includes(request_status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status. Allowed values: ${allowed_statuses.join(", ")}`,
      });
    }

    const stay = await short_term_stay_model.findByIdAndUpdate(
      stay_id,
      { $set: { request_status } },
      { new: true },
    );

    if (!stay) {
      return res.status(404).json({
        status: "error",
        message: "Short term stay not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Request status updated successfully",
      data: { _id: stay._id, request_status: stay.request_status },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating request status",
      error: error.message,
    });
  }
};