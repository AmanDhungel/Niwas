import user_model from "../models/user.model.js";
import bcrypt from "bcrypt";
import {
  upload_file_to_s3,
  delete_file_from_s3,
  build_s3_key,
  clear_temp_files,
} from "../utils/s3.util.js";

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

/* ================= GET USERS ================= */
export const handle_get_users = async (req, res) => {
  try {
    const users = await user_model.find().populate("user_permission_policies");

    return res.status(200).json({
      status: "success",
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching users",
      error: error.message,
    });
  }
};

/* ================= GET USER ================= */
export const handle_get_user = async (req, res) => {
  try {
    const { user_id } = req.params;

    const user = await user_model
      .findById(user_id)
      .populate("user_permission_policies");

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching user",
      error: error.message,
    });
  }
};

/* ================= ADD USER ================= */
export const handle_add_user = async (req, res) => {
  try {
    const {
      user_name,
      user_email,
      user_password,
      user_email_verified,
      user_type,
      user_phone,
      address,
    } = req.body;

    if (!user_name || user_name.trim() === "") {
      clear_temp_files(req.file ? [req.file] : []);
      return res.status(400).json({
        status: "error",
        message: "User name is required.",
      });
    }

    if (!user_email || user_email.trim() === "") {
      clear_temp_files(req.file ? [req.file] : []);
      return res.status(400).json({
        status: "error",
        message: "User email is required.",
      });
    }

    if (!user_password || user_password.trim() === "") {
      clear_temp_files(req.file ? [req.file] : []);
      return res.status(400).json({
        status: "error",
        message: "User password is required.",
      });
    }

    const existing = await user_model.findOne({
      user_email: user_email.trim().toLowerCase(),
    });
    if (existing) {
      clear_temp_files(req.file ? [req.file] : []);
      return res.status(409).json({
        status: "error",
        message: "A user with this email already exists.",
      });
    }

    const rawPayload = {
      user_name,
      user_email: user_email.trim().toLowerCase(),
      user_password,
      user_email_verified,
      user_type,
      user_phone,
      address: address ? address : undefined,
    };

    const payload = sanitizePayload(rawPayload);
    const hashedPassword = await bcrypt.hash(payload.user_password, 10);

    const new_user = await user_model.create({
      ...payload,
      user_password: hashedPassword,
    });

    // Upload photo after creation so user _id is available for the S3 key
    if (req.file) {
      const key = build_s3_key(
        "users",
        new_user._id.toString(),
        "photo",
        req.file.filename,
      );
      const uploaded = await upload_file_to_s3(req.file, key);

      new_user.photo = { url: uploaded.url, key: uploaded.key };
      await new_user.save();
    }

    return res.status(201).json({
      status: "success",
      message: "User added successfully",
      data: new_user,
    });
  } catch (error) {
    clear_temp_files(req.file ? [req.file] : []);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding user",
      error: error.message,
    });
  }
};

/* ================= EDIT USER ================= */
export const handle_edit_user = async (req, res) => {
  try {
    const { user_id } = req.params;
    const {
      user_name,
      user_email,
      user_password,
      user_email_verified,
      user_type,
      user_phone,
      address,
    } = req.body;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      clear_temp_files(req.file ? [req.file] : []);
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Check email uniqueness if email is being changed
    if (
      user_email &&
      user_email.trim().toLowerCase() !== existing_user.user_email
    ) {
      const duplicate = await user_model.findOne({
        user_email: user_email.trim().toLowerCase(),
        _id: { $ne: user_id },
      });
      if (duplicate) {
        clear_temp_files(req.file ? [req.file] : []);
        return res.status(409).json({
          status: "error",
          message: "A user with this email already exists.",
        });
      }
    }

    const rawPayload = {
      user_name,
      user_email: user_email ? user_email.trim().toLowerCase() : undefined,
      user_password,
      user_email_verified,
      user_type,
      user_phone,
      address: address ? address : undefined,
    };

    const payload = sanitizePayload(rawPayload);

    if (payload.user_password) {
      payload.user_password = await bcrypt.hash(payload.user_password, 10);
    }

    // Handle photo update
    if (req.file) {
      // Delete old photo from S3 if it exists
      if (existing_user.photo?.key) {
        await delete_file_from_s3(existing_user.photo.key);
      }

      const key = build_s3_key("users", user_id, "photo", req.file.filename);
      const uploaded = await upload_file_to_s3(req.file, key);

      payload.photo = { url: uploaded.url, key: uploaded.key };
    }

    const updated_user = await user_model.findByIdAndUpdate(
      user_id,
      { $set: payload },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: updated_user,
    });
  } catch (error) {
    clear_temp_files(req.file ? [req.file] : []);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating user",
      error: error.message,
    });
  }
};

export const handle_suspend_user = async (req, res) => {
  try {
    const { user_id } = req.body;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    existing_user.is_suspended = true;
    await existing_user.save();

    return res.status(200).json({
      status: "success",
      message: "User suspended successfully",
      data: existing_user,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while suspending user",
      error: error.message,
    });
  }
};

export const handle_unsuspend_user = async (req, res) => {
  try {
    const { user_id } = req.body;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    existing_user.is_suspended = false;
    await existing_user.save();

    return res.status(200).json({
      status: "success",
      message: "User unsuspended successfully",
      data: existing_user,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while unsuspending user",
      error: error.message,
    });
  }
};
