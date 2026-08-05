import jwt from "jsonwebtoken";
import user_model from "../../models/user.model.js";
import system_setting_model from "../../models/settings/system_setting.model.js";

/* ================= GET GDPR COOKIES ================= */
export const handle_get_gdpr_cookies = async (req, res) => {
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

    let system_setting = await system_setting_model.findOne({ user_id });

    if (!system_setting) {
      system_setting = await system_setting_model.create({ user_id });
    }

    return res.status(200).json({
      status: "success",
      message: "GDPR cookie settings fetched successfully",
      data: system_setting.gdpr_cookies,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching GDPR cookie settings",
      error: error.message,
    });
  }
};

/* ================= UPDATE GDPR COOKIES ================= */
export const handle_update_gdpr_cookies = async (req, res) => {
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

    const {
      consent_text,
      position,
      agree_button_text,
      decline_button_text,
      show_decline_button,
      link,
    } = req.body;

    const VALID_POSITIONS = ["top", "bottom"];
    if (position !== undefined && !VALID_POSITIONS.includes(position)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid position. Allowed: ${VALID_POSITIONS.join(", ")}`,
      });
    }

    const parseBool = (val) => {
      if (typeof val === "boolean") return val;
      if (val === "true")  return true;
      if (val === "false") return false;
      return undefined;
    };

    const update = {};

    if (consent_text !== undefined)
      update["gdpr_cookies.consent_text"] = consent_text.trim();

    if (position !== undefined)
      update["gdpr_cookies.position"] = position;

    if (agree_button_text !== undefined)
      update["gdpr_cookies.agree_button_text"] = agree_button_text.trim();

    if (decline_button_text !== undefined)
      update["gdpr_cookies.decline_button_text"] = decline_button_text.trim();

    if (parseBool(show_decline_button) !== undefined)
      update["gdpr_cookies.show_decline_button"] = parseBool(show_decline_button);

    if (link !== undefined)
      update["gdpr_cookies.link"] = link.trim();

    const updated_setting = await system_setting_model.findOneAndUpdate(
      { user_id },
      { $set: update },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      status: "success",
      message: "GDPR cookie settings updated successfully",
      data: updated_setting.gdpr_cookies,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating GDPR cookie settings",
      error: error.message,
    });
  }
};

/* ================= GET MAINTENANCE MODE ================= */
export const handle_get_maintenance_mode = async (req, res) => {
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

    let system_setting = await system_setting_model.findOne({ user_id });

    if (!system_setting) {
      system_setting = await system_setting_model.create({ user_id });
    }

    return res.status(200).json({
      status: "success",
      message: "Maintenance mode settings fetched successfully",
      data: system_setting.maintenance_mode,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching maintenance mode settings",
      error: error.message,
    });
  }
};

/* ================= UPDATE MAINTENANCE MODE ================= */
export const handle_update_maintenance_mode = async (req, res) => {
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

    const { description, status, existing_image } = req.body;

    const parseBool = (val) => {
      if (typeof val === "boolean") return val;
      if (val === "true")  return true;
      if (val === "false") return false;
      return undefined;
    };

    const update = {};

    if (description !== undefined)
      update["maintenance_mode.description"] = description.trim();

    if (parseBool(status) !== undefined)
      update["maintenance_mode.status"] = parseBool(status);

    /* -------- image: delete old if removed, upload new if provided -------- */
    const system_setting = await system_setting_model.findOne({ user_id });
    const current_image = system_setting?.maintenance_mode?.image;

    if (
      existing_image === "" ||
      existing_image === null ||
      existing_image === undefined
    ) {
      if (current_image?.key) {
        await delete_file_from_s3(current_image.key);
      }
      update["maintenance_mode.image"] = { key: null, url: null };
    }

    const image_file = req.files?.image?.[0] || req.file || null;

    if (image_file) {
      if (current_image?.key) {
        await delete_file_from_s3(current_image.key);
      }
      const key = build_s3_key(
        "system_setting",
        user_id.toString(),
        "maintenance_image",
        image_file.filename,
      );
      const uploaded = await upload_file_to_s3(image_file, key);
      update["maintenance_mode.image"] = {
        key: uploaded.key,
        url: uploaded.url,
      };
      clear_temp_files({ image: [image_file] });
    }

    const updated_setting = await system_setting_model.findOneAndUpdate(
      { user_id },
      { $set: update },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Maintenance mode settings updated successfully",
      data: updated_setting.maintenance_mode,
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating maintenance mode settings",
      error: error.message,
    });
  }
};

/* ================= GET OTP SETTINGS ================= */
export const handle_get_otp_settings = async (req, res) => {
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

    let system_setting = await system_setting_model.findOne({ user_id });

    if (!system_setting) {
      system_setting = await system_setting_model.create({ user_id });
    }

    return res.status(200).json({
      status: "success",
      message: "OTP settings fetched successfully",
      data: system_setting.otp,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching OTP settings",
      error: error.message,
    });
  }
};

/* ================= UPDATE OTP SETTINGS ================= */
export const handle_update_otp_settings = async (req, res) => {
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

    const { type, digit_limit, expiry_time } = req.body;

    const VALID_TYPES = ["email", "sms"];
    if (type !== undefined && !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid OTP type. Allowed: ${VALID_TYPES.join(", ")}`,
      });
    }

    if (digit_limit !== undefined) {
      const parsed = Number(digit_limit);
      if (isNaN(parsed) || parsed < 4 || parsed > 8 || !Number.isInteger(parsed)) {
        return res.status(400).json({
          status: "error",
          message: "digit_limit must be a whole number between 4 and 8.",
        });
      }
    }

    if (expiry_time !== undefined) {
      const parsed = Number(expiry_time);
      if (isNaN(parsed) || parsed < 1 || parsed > 60 || !Number.isInteger(parsed)) {
        return res.status(400).json({
          status: "error",
          message: "expiry_time must be a whole number between 1 and 60 (minutes).",
        });
      }
    }

    const update = {};

    if (type !== undefined)
      update["otp.type"] = type;

    if (digit_limit !== undefined)
      update["otp.digit_limit"] = Number(digit_limit);

    if (expiry_time !== undefined)
      update["otp.expiry_time"] = Number(expiry_time);

    const updated_setting = await system_setting_model.findOneAndUpdate(
      { user_id },
      { $set: update },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      status: "success",
      message: "OTP settings updated successfully",
      data: updated_setting.otp,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating OTP settings",
      error: error.message,
    });
  }
};