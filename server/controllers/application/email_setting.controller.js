import email_setting_model from "../../models/application/email_setting.model.js";

const mask_password = (password = "") => {
  if (password.length <= 4) return "*".repeat(password.length);
  return `${"*".repeat(password.length - 4)}${password.slice(-4)}`;
};

/* ================= CREATE ================= */
export const handle_create_email_setting = async (req, res) => {
  try {
    const { enabled, identifier, port, host, username, password } = req.body;

    if (!identifier || !port || !host || !username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Identifier, port, host, username and password are required.",
      });
    }

    const existing_setting = await email_setting_model.findOne({ identifier: identifier.trim() });
    if (existing_setting) {
      return res.status(400).json({
        status: "error",
        message: "Email setting already exists for this identifier.",
      });
    }

    const email_setting = await email_setting_model.create({
      enabled: enabled ?? false,
      identifier: identifier.trim(),
      port: Number(port),
      host: host.trim(),
      username: username.trim(),
      password,
    });

    const response_data = email_setting.toObject();
    response_data.password = undefined;
    response_data.password_masked = mask_password(password);

    return res.status(201).json({
      status: "success",
      message: "Email setting created successfully.",
      data: response_data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while creating email setting.",
      error: error.message,
    });
  }
};


/* ================= GET ALL ================= */
export const handle_get_email_settings = async (req, res) => {
  try {
    const email_settings = await email_setting_model
      .find()
      .sort({ createdAt: -1 });

    const masked_settings = email_settings.map((item) => {
      const data = item.toObject();
      data.password = undefined;
      data.password_masked = mask_password(item.password);
      return data;
    });

    return res.status(200).json({
      status: "success",
      message: "Email settings fetched successfully.",
      data: masked_settings,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching email settings.",
      error: error.message,
    });
  }
};


/* ================= GET SINGLE ================= */
export const handle_get_single_email_setting = async (req, res) => {
  try {
    const { email_setting_id } = req.params;

    const email_setting = await email_setting_model.findById(email_setting_id);

    if (!email_setting) {
      return res.status(404).json({
        status: "error",
        message: "Email setting not found.",
      });
    }

    const response_data = email_setting.toObject();
    response_data.password = undefined;
    response_data.password_masked = mask_password(email_setting.password);

    return res.status(200).json({
      status: "success",
      message: "Email setting fetched successfully.",
      data: response_data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching email setting.",
      error: error.message,
    });
  }
};


/* ================= UPDATE ================= */
export const handle_update_email_setting = async (req, res) => {
  try {
    const { email_setting_id } = req.params;
    const { enabled, identifier, port, host, username, password } = req.body;

    const email_setting = await email_setting_model.findById(email_setting_id);

    if (!email_setting) {
      return res.status(404).json({
        status: "error",
        message: "Email setting not found.",
      });
    }

    if (identifier !== undefined) {
      const trimmed_identifier = identifier.trim();

      const identifier_exists = await email_setting_model.findOne({
        identifier: trimmed_identifier,
        _id: { $ne: email_setting_id },
      });

      if (identifier_exists) {
        return res.status(400).json({
          status: "error",
          message: "Another email setting already exists for this identifier.",
        });
      }

      email_setting.identifier = trimmed_identifier;
    }

    if (enabled !== undefined) email_setting.enabled = Boolean(enabled);
    if (port !== undefined) email_setting.port = Number(port);
    if (host !== undefined) email_setting.host = host.trim();
    if (username !== undefined) email_setting.username = username.trim();
    if (password !== undefined) email_setting.password = password;

    await email_setting.save();

    const response_data = email_setting.toObject();
    response_data.password = undefined;
    response_data.password_masked = mask_password(email_setting.password);

    return res.status(200).json({
      status: "success",
      message: "Email setting updated successfully.",
      data: response_data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating email setting.",
      error: error.message,
    });
  }
};


/* ================= DELETE ================= */
export const handle_delete_email_setting = async (req, res) => {
  try {
    const { email_setting_id } = req.params;

    const email_setting = await email_setting_model.findById(email_setting_id);
    if (!email_setting) {
      return res.status(404).json({
        status: "error",
        message: "Email setting not found.",
      });
    }

    await email_setting_model.deleteOne({ _id: email_setting_id });

    return res.status(200).json({
      status: "success",
      message: "Email setting deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting email setting.",
      error: error.message,
    });
  }
};