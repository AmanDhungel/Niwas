import jwt from "jsonwebtoken";
import user_model from "../../models/user.model.js";
import policy_model from "../../models/hrm/policy.model.js";
import {
  upload_file_to_s3,
  delete_file_from_s3,
  build_s3_key,
  clear_temp_files,
} from "../../utils/s3.util.js";

/* ================= GET POLICIES ================= */
export const handle_get_policies = async (req, res) => {
  try {
    const policies = await policy_model.find().populate("department");

    return res.status(200).json({
      status: "success",
      message: "Policies fetched successfully",
      data: policies,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching policies",
      error: error.message,
    });
  }
};

/* ================= GET POLICY ================= */
export const handle_get_policy = async (req, res) => {
  try {
    const { policy_id } = req.params;

    const policy = await policy_model.findById(policy_id).populate("department");
    if (!policy) {
      return res.status(404).json({
        status: "error",
        message: "Policy not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Policy fetched successfully",
      data: policy,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching policy",
      error: error.message,
    });
  }
};

/* ================= ADD POLICY ================= */
export const handle_add_policy = async (req, res) => {
  try {
    const { user_token } = req.cookies;
    const { user_id }    = jwt.verify(user_token, process.env.JWT_SECRET);

    const user = await user_model.findOne({ _id: user_id, user_type: "admin" });
    if (!user) {
      clear_temp_files(req.files);
      return res.status(401).json({
        status: "error",
        message: "You are not authorized to perform this action.",
        error: "Unauthorized",
      });
    }

    const { name, appraisal_date, department } = req.body;

    const policy = await policy_model.create({
      name:           name?.trim() || "",
      appraisal_date: appraisal_date || null,
      department:     department     || null,
      files:          [],
    });

    /* -------- Upload files to S3 -------- */
    const uploaded_files = req.files?.files || [];

    if (uploaded_files.length) {
      for (const file of uploaded_files) {
        const key      = build_s3_key("policy", policy._id.toString(), "files", file.filename);
        const uploaded = await upload_file_to_s3(file, key);
        policy.files.push({ file: uploaded.url, key: uploaded.key });
      }
      await policy.save();
    }

    return res.status(201).json({
      status: "success",
      message: "Policy added successfully",
      data: policy,
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding policy",
      error: error.message,
    });
  }
};

/* ================= EDIT POLICY ================= */
export const handle_edit_policy = async (req, res) => {
  try {
    const { policy_id } = req.params;

    const policy = await policy_model.findById(policy_id);
    if (!policy) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Policy not found",
      });
    }

    const { name, appraisal_date, department, existing_files } = req.body;

    if (name !== undefined)           policy.name           = name.trim();
    if (appraisal_date !== undefined) policy.appraisal_date = appraisal_date;
    if (department !== undefined)     policy.department     = department;

    /* -------- Remove deleted files from S3 -------- */
    if (existing_files) {
      const parsed_existing = JSON.parse(existing_files);

      const removed = (policy.files || []).filter(
        (f) => !parsed_existing.includes(f.file)
      );
      for (const f of removed) {
        await delete_file_from_s3(f.key);
      }

      policy.files = (policy.files || []).filter((f) =>
        parsed_existing.includes(f.file)
      );
    }

    /* -------- Upload new files to S3 -------- */
    const uploaded_files = req.files?.files || [];

    if (uploaded_files.length) {
      for (const file of uploaded_files) {
        const key      = build_s3_key("policy", policy._id.toString(), "files", file.filename);
        const uploaded = await upload_file_to_s3(file, key);
        policy.files.push({ file: uploaded.url, key: uploaded.key });
      }
    }

    await policy.save();

    return res.status(200).json({
      status: "success",
      message: "Policy updated successfully",
      data: policy,
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating policy",
      error: error.message,
    });
  }
};

/* ================= DELETE POLICY ================= */
export const handle_delete_policy = async (req, res) => {
  try {
    const { policy_id } = req.params;

    const policy = await policy_model.findById(policy_id);
    if (!policy) {
      return res.status(404).json({
        status: "error",
        message: "Policy not found",
      });
    }

    /* -------- Delete all S3 files for this policy -------- */
    for (const f of policy.files || []) {
      await delete_file_from_s3(f.key);
    }

    await policy_model.findByIdAndDelete(policy_id);

    return res.status(200).json({
      status: "success",
      message: "Policy deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting policy",
      error: error.message,
    });
  }
};