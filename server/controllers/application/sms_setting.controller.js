import sms_setting_model from "../../models/application/sms_setting.model.js";

const mask_api_key = (api_key = "") => {
  if (api_key.length <= 4) return "*".repeat(api_key.length);
  return `${"*".repeat(api_key.length - 4)}${api_key.slice(-4)}`;
};

/* ================= CREATE / SAVE ================= */
export const handle_create_sms_setting = async (req, res) => {
  try {
    const { enabled, provider, api_key } = req.body;

    if (!provider || !api_key) {
      return res.status(400).json({
        status: "error",
        message: "Provider and api_key are required.",
      });
    }

    if (!["nestsms", "other"].includes(provider)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid provider. Allowed values are nestsms and other.",
      });
    }

    const existing_setting = await sms_setting_model.findOne({ provider });
    if (existing_setting) {
      return res.status(400).json({
        status: "error",
        message: "SMS setting already exists for this provider.",
      });
    }

    const sms_setting = await sms_setting_model.create({
      enabled: enabled ?? false,
      provider,
      api_key,
      api_key_masked: mask_api_key(api_key),
    });

    return res.status(201).json({
      status: "success",
      message: "SMS setting created successfully.",
      data: sms_setting,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while creating SMS setting.",
      error: error.message,
    });
  }
};


/* ================= GET ALL ================= */
export const handle_get_sms_settings = async (req, res) => {
  try {
    const sms_settings = await sms_setting_model
      .find()
      .select("-api_key")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      message: "SMS settings fetched successfully.",
      data: sms_settings,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching SMS settings.",
      error: error.message,
    });
  }
};


/* ================= GET SINGLE ================= */
export const handle_get_single_sms_setting = async (req, res) => {
  try {
    const { sms_setting_id } = req.params;

    const sms_setting = await sms_setting_model
      .findById(sms_setting_id)
      .select("-api_key");

    if (!sms_setting) {
      return res.status(404).json({
        status: "error",
        message: "SMS setting not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "SMS setting fetched successfully.",
      data: sms_setting,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching SMS setting.",
      error: error.message,
    });
  }
};


/* ================= UPDATE ================= */
export const handle_update_sms_setting = async (req, res) => {
  try {
    const { sms_setting_id } = req.params;
    const { enabled, provider, api_key } = req.body;

    const sms_setting = await sms_setting_model.findById(sms_setting_id);

    if (!sms_setting) {
      return res.status(404).json({
        status: "error",
        message: "SMS setting not found.",
      });
    }

    if (provider !== undefined) {
      if (!["nestsms", "other"].includes(provider)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid provider. Allowed values are nestsms and other.",
        });
      }

      const provider_exists = await sms_setting_model.findOne({
        provider,
        _id: { $ne: sms_setting_id },
      });

      if (provider_exists) {
        return res.status(400).json({
          status: "error",
          message: "Another SMS setting already exists for this provider.",
        });
      }

      sms_setting.provider = provider;
    }

    if (enabled !== undefined) sms_setting.enabled = Boolean(enabled);

    if (api_key !== undefined) {
      sms_setting.api_key = api_key;
      sms_setting.api_key_masked = mask_api_key(api_key);
    }

    await sms_setting.save();

    const response_data = sms_setting.toObject();
    delete response_data.api_key;

    return res.status(200).json({
      status: "success",
      message: "SMS setting updated successfully.",
      data: response_data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating SMS setting.",
      error: error.message,
    });
  }
};


/* ================= DELETE ================= */
export const handle_delete_sms_setting = async (req, res) => {
  try {
    const { sms_setting_id } = req.params;

    const sms_setting = await sms_setting_model.findById(sms_setting_id);
    if (!sms_setting) {
      return res.status(404).json({
        status: "error",
        message: "SMS setting not found.",
      });
    }

    await sms_setting_model.deleteOne({ _id: sms_setting_id });

    return res.status(200).json({
      status: "success",
      message: "SMS setting deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting SMS setting.",
      error: error.message,
    });
  }
};