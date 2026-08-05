import jwt from "jsonwebtoken";
import {
  upload_file_to_s3,
  delete_file_from_s3,
  build_s3_key,
  clear_temp_files,
} from "../../utils/s3.util.js";
import user_model from "../../models/user.model.js";
import general_setting_model from "../../models/settings/general_setting.model.js";
import bcrypt from "bcrypt";

/* ================= GET PROFILE SETTINGS ================= */
export const handle_get_profile_settings = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const user = await user_model
      .findById(user_id)
      .select("photo user_name user_email user_phone address");

    return res.status(200).json({
      status: "success",
      message: "Profile settings fetched successfully",
      data: {
        photo: user.photo || null,
        user_name: user.user_name || null,
        user_email: user.user_email || null,
        user_phone: user.user_phone || null,
        address: user.address || {},
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching profile settings",
      error: error.message,
    });
  }
};

/* ================= UPDATE PROFILE SETTINGS ================= */
export const handle_update_profile_settings = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      clear_temp_files(req.files);
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const { user_name, user_email, user_phone, address, remove_photo } =
      req.body;

    const update = {};

    if (user_name) update.user_name = user_name.trim();
    if (user_email) update.user_email = user_email.trim();
    if (user_phone) update.user_phone = user_phone.trim();

    /* -------- Address -------- */
    if (address) {
      const parsed_address =
        typeof address === "string" ? JSON.parse(address) : address;

      update.address = {
        address_line:
          parsed_address.address_line ?? existing_user.address?.address_line,
        country: parsed_address.country ?? existing_user.address?.country,
        state: parsed_address.state ?? existing_user.address?.state,
        city: parsed_address.city ?? existing_user.address?.city,
        postal_code:
          parsed_address.postal_code ?? existing_user.address?.postal_code,
      };
    }

    /* -------- Remove existing photo -------- */
    if (remove_photo === "true" && existing_user.photo?.key) {
      await delete_file_from_s3(existing_user.photo.key);
      update.photo = { url: null, key: null };
    }

    /* -------- Upload new photo -------- */
    const photo_file = req.files?.photo?.[0] || null;
    if (photo_file) {
      if (existing_user.photo?.key) {
        await delete_file_from_s3(existing_user.photo.key);
      }

      const key = build_s3_key(
        "user",
        user_id.toString(),
        "photo",
        photo_file.filename,
      );
      const uploaded = await upload_file_to_s3(photo_file, key);

      update.photo = {
        url: uploaded.url,
        key: uploaded.key,
      };
    }

    const updated_user = await user_model
      .findByIdAndUpdate(user_id, { $set: update }, { new: true })
      .select("photo user_name user_email user_phone address");

    clear_temp_files(req.files);

    return res.status(200).json({
      status: "success",
      message: "Profile settings updated successfully",
      data: {
        photo: updated_user.photo || null,
        user_name: updated_user.user_name || null,
        user_email: updated_user.user_email || null,
        user_phone: updated_user.user_phone || null,
        address: updated_user.address || {},
      },
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating profile settings",
      error: error.message,
    });
  }
};

/* ================= DEFAULT NOTIFICATION SETTINGS ================= */
const default_notification_settings = {
  new_hire_onboarding_notification: { push: true, sms: true, email: true },
  time_off_and_leave_requests_notification: {
    push: true,
    sms: true,
    email: true,
  },
  employee_performance_and_review_updates_notification: {
    push: true,
    sms: true,
    email: true,
  },
  payroll_and_compensation_notifications: {
    push: true,
    sms: true,
    email: true,
  },
  job_application_and_recruitment_notifications: {
    push: true,
    sms: true,
    email: true,
  },
};

/* ================= GET NOTIFICATION SETTINGS ================= */
export const handle_get_notification_settings = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    /* -------- Find or create with defaults -------- */
    let general_setting = await general_setting_model.findOne({ user_id });

    if (!general_setting) {
      general_setting = await general_setting_model.create({
        user_id,
        notification_settings: default_notification_settings,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Notification settings fetched successfully",
      data: general_setting.notification_settings,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching notification settings",
      error: error.message,
    });
  }
};

/* ================= UPDATE NOTIFICATION SETTINGS ================= */
export const handle_update_notification_settings = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const { notification_settings } = req.body;

    if (!notification_settings || typeof notification_settings !== "object") {
      return res.status(400).json({
        status: "error",
        message: "notification_settings object is required",
      });
    }

    /* -------- Build dot-notation $set to do partial update -------- */
    const update = {};
    const allowed_keys = [
      "new_hire_onboarding_notification",
      "time_off_and_leave_requests_notification",
      "employee_performance_and_review_updates_notification",
      "payroll_and_compensation_notifications",
      "job_application_and_recruitment_notifications",
    ];
    const allowed_channels = ["push", "sms", "email"];

    for (const module_key of allowed_keys) {
      if (notification_settings[module_key]) {
        for (const channel of allowed_channels) {
          if (typeof notification_settings[module_key][channel] === "boolean") {
            update[`notification_settings.${module_key}.${channel}`] =
              notification_settings[module_key][channel];
          }
        }
      }
    }

    /* -------- Upsert: create with defaults if not exists, then patch -------- */
    const updated_setting = await general_setting_model.findOneAndUpdate(
      { user_id },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Notification settings updated successfully",
      data: updated_setting.notification_settings,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating notification settings",
      error: error.message,
    });
  }
};

export const handle_change_password = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        status: "error",
        message: "current_password and new_password are required",
      });
    }

    const is_match = await bcrypt.compare(
      current_password,
      existing_user.user_password,
    );
    if (!is_match) {
      return res.status(400).json({
        status: "error",
        message: "Current password is incorrect",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed_password = await bcrypt.hash(new_password, salt);

    existing_user.user_password = hashed_password;
    await existing_user.save();

    return res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while changing password",
      error: error.message,
    });
  }
};

export const handle_delete_account = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    existing_user.is_deleted = true;
    await existing_user.save();

    res.clearCookie("user_token");

    return res.status(200).json({
      status: "success",
      message: "Account deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting account",
      error: error.message,
    });
  }
};

export const handle_deactivate_account = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    existing_user.is_active = false;
    await existing_user.save();

    res.clearCookie("user_token");

    return res.status(200).json({
      status: "success",
      message: "Account deactivated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deactivating account",
      error: error.message,
    });
  }
};


