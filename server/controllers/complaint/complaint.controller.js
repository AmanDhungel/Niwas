import fs from "fs";
import path from "path";
import complaint_model from "../../models/complaint/complaint.model.js";
import user_model from "../../models/user.model.js";
import jwt from "jsonwebtoken";
import board_model from "../../models/board/board.model.js";

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
    if (!isEmptyValue(value)) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

const moveFile = (file, destDir) => {
  fs.mkdirSync(destDir, { recursive: true });
  const finalPath = path.join(destDir, file.filename);
  fs.renameSync(file.path, finalPath);
  return finalPath;
};

const processAttachments = (files, complaint_id) => {
  const attachments = {
    photos: [],
    videos: [],
    audios: [],
    documents: [],
  };

  const base = path.join(
    process.cwd(),
    "uploads/complaint",
    complaint_id.toString(),
  );

  for (const type of ["photos", "videos", "audios", "documents"]) {
    const uploaded = files[type] || [];
    for (const file of uploaded) {
      const destDir = path.join(base, type);
      moveFile(file, destDir);
      attachments[type].push(
        `/uploads/complaint/${complaint_id}/${type}/${file.filename}`,
      );
    }
  }

  return attachments;
};

/* ================= GET ALL COMPLAINTS ================= */
export const handle_get_complaints = async (req, res) => {
  try {
    const complaints = await complaint_model
      .find()
      .populate("property")
      .populate("submitted_by")
      .populate("assigned_to");

    return res.status(200).json({
      status: "success",
      message: "Complaints fetched successfully",
      data: complaints,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching complaints",
      error: error.message,
    });
  }
};

/* ================= GET COMPLAINT BY ID ================= */
export const handle_get_complaint = async (req, res) => {
  try {
    const { complaint_id } = req.params;

    const complaint = await complaint_model
      .findById(complaint_id)
      .populate("property")
      .populate("submitted_by")
      .populate("assigned_to");

    if (!complaint) {
      return res.status(404).json({
        status: "error",
        message: "Complaint not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Complaint fetched successfully",
      data: complaint,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching complaint",
      error: error.message,
    });
  }
};

/* ================= ADD COMPLAINT ================= */
export const handle_add_complaint = async (req, res) => {
  const files = req.files || {};
  const { user_token } = req.cookies;

  const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);

  const user_id = verify_token.user_id;

  const user = await user_model.findById(user_id);

  if (!user) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized",
    });
  }
  try {
    const {
      property,
      pipeline,
      category,
      priority,
      issue_title,
      detailed_description,
      preferred_contact_time,
    } = req.body;

    const rawPayload = {
      property,
      submitted_by: user_id,
      category,
      priority,
      issue_title,
      detailed_description,
      preferred_contact_time,
      attachments: { photos: [], videos: [], audios: [], documents: [] },
      complaint_status: "new",

      ...(pipeline && { pipeline: JSON.parse(pipeline) }),
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const { domain_workspace, vendor_workspace, board, tasklist } =
      cleanedPayload.pipeline || {};

    const board_db = await board_model.findOne({
      _id: board,
      workspace: domain_workspace,
      vendor: vendor_workspace,
    });

    const tasklist_db = board_db?.task_lists?.find(
      (tl) => tl._id.toString() === tasklist?.toString(),
    );

    if (board_db && tasklist_db) {
      tasklist_db.tasks.push({
        title: issue_title,
        description: detailed_description,
        category: "complaint",
        custom_fields: [
          {
            field_name: "Priority",
            field_type: "text",
            field_value: priority || "",
          },
        ],
        origin: "complaint",
      });
      await board_db.save();
    }

    const complaint = await complaint_model.create(cleanedPayload);

    if (board_db && tasklist_db) {
      const task = tasklist_db.tasks.find(
        (t) => t.origin === "complaint" && t.title === issue_title,
      );
      if (task) {
        task.complaint = complaint._id;
        await board_db.save();
      }
    }

    /* -------- Move uploaded files -------- */
    const attachments = processAttachments(files, complaint._id);
    complaint.attachments = attachments;
    await complaint.save();

    return res.status(201).json({
      status: "success",
      message: "Complaint submitted successfully",
      data: complaint,
    });
  } catch (error) {
    /* -------- Cleanup temp files on error -------- */
    Object.values(files)
      .flat()
      .forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });

    return res.status(500).json({
      status: "error",
      message: "An error occurred while submitting complaint",
      error: error.message,
    });
  }
};

export const handle_get_user_complaints = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);

    const user_id = verify_token.user_id;

    const user = await user_model.findById(user_id);

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const complaints = await complaint_model
      .find({ submitted_by: user_id })
      .populate("property")
      .populate("assigned_to");

    return res.status(200).json({
      status: "success",
      message: "User complaints fetched successfully",
      data: complaints,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching user complaints",
      error: error.message,
    });
  }
};

export const handle_update_complaint_status = async (req, res) => {
  try {
    const { complaint_id } = req.params;
    const { complaint_status, resolution_notes } = req.body;

    const existing = await complaint_model.findById(complaint_id);
    if (!existing) {
      return res.status(404).json({
        status: "error",
        message: "Complaint not found",
      });
    }

    const updateData = {
      complaint_status,
      resolution_notes: resolution_notes || existing.resolution_notes,
    };

    if (complaint_status === "resolved" && !existing.resolved_at) {
      updateData.resolved_at = new Date();
    }

    const updated_complaint = await complaint_model.findByIdAndUpdate(
      complaint_id,
      { $set: updateData },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Complaint status updated successfully",
      data: updated_complaint,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating complaint status",
      error: error.message,
    });
  }
};

/* ================= EDIT COMPLAINT ================= */
export const handle_edit_complaint = async (req, res) => {
  const files = req.files || {};
  try {
    const { complaint_id } = req.params;

    const {
      category,
      priority,
      issue_title,
      detailed_description,
      preferred_contact_time,
      complaint_status,
      assigned_to,
      resolution_notes,
    } = req.body;

    const existing = await complaint_model.findById(complaint_id);
    if (!existing) {
      return res.status(404).json({
        status: "error",
        message: "Complaint not found",
      });
    }

    const rawPayload = {
      category,
      priority,
      issue_title,
      detailed_description,
      preferred_contact_time,
      complaint_status,
      assigned_to: assigned_to || undefined,
      resolution_notes,
    };

    /* -------- Auto-set resolved_at when status changes to resolved -------- */
    if (complaint_status === "resolved" && !existing.resolved_at) {
      rawPayload.resolved_at = new Date();
    }

    /* -------- Append new files to existing attachments -------- */
    const hasNewFiles = Object.values(files).flat().length > 0;
    if (hasNewFiles) {
      const new_attachments = processAttachments(files, complaint_id);
      rawPayload["attachments.photos"] = [
        ...existing.attachments.photos,
        ...new_attachments.photos,
      ];
      rawPayload["attachments.videos"] = [
        ...existing.attachments.videos,
        ...new_attachments.videos,
      ];
      rawPayload["attachments.audios"] = [
        ...existing.attachments.audios,
        ...new_attachments.audios,
      ];
      rawPayload["attachments.documents"] = [
        ...existing.attachments.documents,
        ...new_attachments.documents,
      ];
    }

    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_complaint = await complaint_model.findByIdAndUpdate(
      complaint_id,
      { $set: cleanedPayload },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Complaint updated successfully",
      data: updated_complaint,
    });
  } catch (error) {
    Object.values(files)
      .flat()
      .forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });

    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating complaint",
      error: error.message,
    });
  }
};

/* ================= DELETE COMPLAINT ================= */
export const handle_delete_complaint = async (req, res) => {
  try {
    const { complaint_id } = req.params;

    const deleted_complaint =
      await complaint_model.findByIdAndDelete(complaint_id);

    if (!deleted_complaint) {
      return res.status(404).json({
        status: "error",
        message: "Complaint not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Complaint deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting complaint",
      error: error.message,
    });
  }
};
