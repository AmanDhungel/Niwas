import workorder_model from "../../models/workorder/workorder.model.js";
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
  if (value instanceof Date) return false;
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

/* ================= HELPER: Upload batch of files to S3 ================= */
const upload_files_to_s3_batch = async (files, entity, id, folder) => {
  const results = [];
  for (const file of files) {
    const key = build_s3_key(entity, id, folder, file.filename);
    const uploaded = await upload_file_to_s3(file, key);
    results.push({ url: uploaded.url, key: uploaded.key });
  }
  return results;
};

/* ================= HELPER: Delete array of S3 keys ================= */
const delete_s3_keys = async (keys = []) => {
  for (const key of keys) {
    if (key) await delete_file_from_s3(key);
  }
};

/* ================= GET ALL WORKORDERS ================= */
export const handle_get_workorders = async (req, res) => {
  try {
    const workorders = await workorder_model
      .find()
      .populate("basic_info.location_information.property")
      .populate("assignment.vendor");

    return res.status(200).json({
      status: "success",
      message: "Workorders fetched successfully",
      data: workorders,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching workorders",
      error: error.message,
    });
  }
};

/* ================= GET WORKORDER BY ID ================= */
export const handle_get_workorder = async (req, res) => {
  try {
    const { workorder_id } = req.params;

    const workorder = await workorder_model
      .findById(workorder_id)
      .populate("basic_info.location_information.property")
      .populate("assignment.vendor");

    if (!workorder) {
      return res.status(404).json({
        status: "error",
        message: "Workorder not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Workorder fetched successfully",
      data: workorder,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching workorder",
      error: error.message,
    });
  }
};

/* ================= ADD WORKORDER ================= */
export const handle_add_workorder = async (req, res) => {
  try {
    const { basic_info, assignment, cost_estimate } = req.body;

    const parsed_basic_info =
      typeof basic_info === "string" ? JSON.parse(basic_info) : basic_info;
    const parsed_assignment =
      typeof assignment === "string" ? JSON.parse(assignment) : assignment;
    const parsed_cost_estimate =
      typeof cost_estimate === "string"
        ? JSON.parse(cost_estimate)
        : cost_estimate;

    /* -------- Create workorder first to get _id for S3 keys -------- */
    const workorder = await workorder_model.create({
      basic_info: parsed_basic_info || {},
      assignment: parsed_assignment || {},
      cost_estimate: parsed_cost_estimate || {},
      documentation: {
        before_photos: [],
        after_photos: [],
      },
    });

    const id = workorder._id.toString();
    const files = req.files || {};

    /* -------- Upload before_photos -------- */
    const before_uploads = await upload_files_to_s3_batch(
      files.before_photos || [],
      "workorder",
      id,
      "before_photos",
    );
    workorder.documentation.before_photos = before_uploads.map((u) => ({
      url: u.url,
      key: u.key,
    }));

    /* -------- Upload after_photos -------- */
    const after_uploads = await upload_files_to_s3_batch(
      files.after_photos || [],
      "workorder",
      id,
      "after_photos",
    );
    workorder.documentation.after_photos = after_uploads.map((u) => ({
      url: u.url,
      key: u.key,
    }));

    await workorder.save();
    clear_temp_files(req.files);

    return res.status(201).json({
      status: "success",
      message: "Workorder added successfully",
      data: workorder,
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding workorder",
      error: error.message,
    });
  }
};

/* ================= EDIT WORKORDER ================= */
export const handle_edit_workorder = async (req, res) => {
  try {
    const { workorder_id } = req.params;

    const workorder = await workorder_model.findById(workorder_id);
    if (!workorder) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Workorder not found",
      });
    }

    const {
      basic_info,
      assignment,
      cost_estimate,
      existing_before_photos,
      existing_after_photos,
    } = req.body;

    const files = req.files || {};
    const id = workorder._id.toString();

    /* -------- Reconcile before_photos -------- */
    const kept_before_urls = existing_before_photos
      ? JSON.parse(existing_before_photos)
      : [];

    const db_before = workorder.documentation?.before_photos || [];

    // Delete removed ones from S3
    const removed_before = db_before.filter(
      (item) => !kept_before_urls.includes(item.url ?? item),
    );
    await delete_s3_keys(
      removed_before.map((item) => item.key).filter(Boolean),
    );

    // Keep surviving entries
    const kept_before = db_before.filter((item) =>
      kept_before_urls.includes(item.url ?? item),
    );

    // Upload new before_photos
    const new_before_uploads = await upload_files_to_s3_batch(
      files.before_photos || [],
      "workorder",
      id,
      "before_photos",
    );

    const updated_before_photos = [
      ...kept_before,
      ...new_before_uploads.map((u) => ({ url: u.url, key: u.key })),
    ];

    /* -------- Reconcile after_photos -------- */
    const kept_after_urls = existing_after_photos
      ? JSON.parse(existing_after_photos)
      : [];

    const db_after = workorder.documentation?.after_photos || [];

    // Delete removed ones from S3
    const removed_after = db_after.filter(
      (item) => !kept_after_urls.includes(item.url ?? item),
    );
    await delete_s3_keys(removed_after.map((item) => item.key).filter(Boolean));

    // Keep surviving entries
    const kept_after = db_after.filter((item) =>
      kept_after_urls.includes(item.url ?? item),
    );

    // Upload new after_photos
    const new_after_uploads = await upload_files_to_s3_batch(
      files.after_photos || [],
      "workorder",
      id,
      "after_photos",
    );

    const updated_after_photos = [
      ...kept_after,
      ...new_after_uploads.map((u) => ({ url: u.url, key: u.key })),
    ];

    /* -------- Parse JSON fields -------- */
    const parsed_basic_info =
      typeof basic_info === "string" ? JSON.parse(basic_info) : basic_info;
    const parsed_assignment =
      typeof assignment === "string" ? JSON.parse(assignment) : assignment;
    const parsed_cost_estimate =
      typeof cost_estimate === "string"
        ? JSON.parse(cost_estimate)
        : cost_estimate;

    const rawPayload = {
      basic_info: parsed_basic_info,
      assignment: parsed_assignment,
      cost_estimate: parsed_cost_estimate,
      documentation: {
        before_photos: updated_before_photos,
        after_photos: updated_after_photos,
      },
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_workorder = await workorder_model.findByIdAndUpdate(
      workorder_id,
      { $set: cleanedPayload },
      { new: true },
    );

    clear_temp_files(req.files);

    return res.status(200).json({
      status: "success",
      message: "Workorder updated successfully",
      data: updated_workorder,
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating workorder",
      error: error.message,
    });
  }
};

/* ================= DELETE WORKORDER ================= */
export const handle_delete_workorder = async (req, res) => {
  try {
    const { workorder_id } = req.params;

    const workorder = await workorder_model.findById(workorder_id);
    if (!workorder) {
      return res.status(404).json({
        status: "error",
        message: "Workorder not found",
      });
    }

    /* -------- Delete all S3 photos -------- */
    await delete_s3_keys(
      (workorder.documentation?.before_photos || [])
        .map((item) => item.key)
        .filter(Boolean),
    );

    await delete_s3_keys(
      (workorder.documentation?.after_photos || [])
        .map((item) => item.key)
        .filter(Boolean),
    );

    await workorder_model.findByIdAndDelete(workorder_id);

    return res.status(200).json({
      status: "success",
      message: "Workorder deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting workorder",
      error: error.message,
    });
  }
};