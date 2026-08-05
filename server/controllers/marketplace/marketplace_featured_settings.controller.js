import marketplace_featured_settings_model from "../../models/marketplace/marketplace_featured_settings.model.js";
import { DEFAULT_FEATURED_SETTINGS } from "./marketplace_featured_settings.defaults.js";

/* ================= HELPER: Get or auto-create singleton ================= */
const get_or_create_settings = async () => {
  let settings = await marketplace_featured_settings_model.findOne({
    singleton_key: "global",
  });

  if (!settings) {
    settings = await marketplace_featured_settings_model.create(
      DEFAULT_FEATURED_SETTINGS,
    );
  }

  return settings;
};

/* ================================================== */
/*             GENERAL SETTINGS                       */
/* ================================================== */

/* -------- GET general settings only -------- */
export const handle_get_general_settings = async (req, res) => {
  try {
    const settings = await get_or_create_settings();

    return res.status(200).json({
      status: "success",
      message: "General settings fetched successfully",
      data: settings.general_settings,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching general settings",
      error: error.message,
    });
  }
};

/* -------- EDIT general settings only -------- */
export const handle_edit_general_settings = async (req, res) => {
  try {
    const { general_settings } = req.body;

    if (!general_settings) {
      return res.status(400).json({
        status: "error",
        message: "general_settings is required",
      });
    }

    await get_or_create_settings();

    const parsed =
      typeof general_settings === "string"
        ? JSON.parse(general_settings)
        : general_settings;

    const updated_settings =
      await marketplace_featured_settings_model.findOneAndUpdate(
        { singleton_key: "global" },
        { $set: { general_settings: parsed } },
        { new: true },
      );

    return res.status(200).json({
      status: "success",
      message: "General settings updated successfully",
      data: updated_settings.general_settings,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating general settings",
      error: error.message,
    });
  }
};

/* -------- RESET general settings to defaults -------- */
export const handle_reset_general_settings = async (req, res) => {
  try {
    await get_or_create_settings();

    const reset_settings =
      await marketplace_featured_settings_model.findOneAndUpdate(
        { singleton_key: "global" },
        {
          $set: {
            general_settings: DEFAULT_FEATURED_SETTINGS.general_settings,
          },
        },
        { new: true },
      );

    return res.status(200).json({
      status: "success",
      message: "General settings reset to defaults successfully",
      data: reset_settings.general_settings,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while resetting general settings",
      error: error.message,
    });
  }
};

/* ================================================== */
/*            DISPLAY PREFERENCES                     */
/* ================================================== */

/* -------- GET display preferences only -------- */
export const handle_get_display_preferences = async (req, res) => {
  try {
    const settings = await get_or_create_settings();

    return res.status(200).json({
      status: "success",
      message: "Display preferences fetched successfully",
      data: settings.display_preferences,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching display preferences",
      error: error.message,
    });
  }
};

/* -------- EDIT display preferences only -------- */
export const handle_edit_display_preferences = async (req, res) => {
  try {
    const { display_preferences } = req.body;

    if (!display_preferences) {
      return res.status(400).json({
        status: "error",
        message: "display_preferences is required",
      });
    }

    await get_or_create_settings();

    const parsed =
      typeof display_preferences === "string"
        ? JSON.parse(display_preferences)
        : display_preferences;

    const updated_settings =
      await marketplace_featured_settings_model.findOneAndUpdate(
        { singleton_key: "global" },
        { $set: { display_preferences: parsed } },
        { new: true },
      );

    return res.status(200).json({
      status: "success",
      message: "Display preferences updated successfully",
      data: updated_settings.display_preferences,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating display preferences",
      error: error.message,
    });
  }
};

/* -------- RESET display preferences to defaults -------- */
export const handle_reset_display_preferences = async (req, res) => {
  try {
    await get_or_create_settings();

    const reset_settings =
      await marketplace_featured_settings_model.findOneAndUpdate(
        { singleton_key: "global" },
        {
          $set: {
            display_preferences: DEFAULT_FEATURED_SETTINGS.display_preferences,
          },
        },
        { new: true },
      );

    return res.status(200).json({
      status: "success",
      message: "Display preferences reset to defaults successfully",
      data: reset_settings.display_preferences,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while resetting display preferences",
      error: error.message,
    });
  }
};

/* ================================================== */
/*              FULL SETTINGS                         */
/* ================================================== */

/* -------- GET full settings -------- */
export const handle_get_featured_settings = async (req, res) => {
  try {
    const settings = await get_or_create_settings();

    return res.status(200).json({
      status: "success",
      message: "Featured settings fetched successfully",
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching featured settings",
      error: error.message,
    });
  }
};

/* -------- RESET full settings to defaults -------- */
export const handle_reset_featured_settings = async (req, res) => {
  try {
    await get_or_create_settings();

    const reset_settings =
      await marketplace_featured_settings_model.findOneAndUpdate(
        { singleton_key: "global" },
        {
          $set: {
            general_settings: DEFAULT_FEATURED_SETTINGS.general_settings,
            display_preferences: DEFAULT_FEATURED_SETTINGS.display_preferences,
          },
        },
        { new: true },
      );

    return res.status(200).json({
      status: "success",
      message: "Featured settings reset to defaults successfully",
      data: reset_settings,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while resetting featured settings",
      error: error.message,
    });
  }
};