import marketplace_search_settings_model from "../../models/marketplace/marketplace_search_settings.model.js";
import { DEFAULT_SEARCH_SETTINGS } from "./marketplace_search_settings.defaults.js";

/* ================= HELPER: Get or auto-create singleton ================= */
const get_or_create_settings = async () => {
  let settings = await marketplace_search_settings_model.findOne({
    singleton_key: "global",
  });

  if (!settings) {
    settings = await marketplace_search_settings_model.create(
      DEFAULT_SEARCH_SETTINGS,
    );
  }

  return settings;
};

/* ================================================== */
/*               RANKING FACTORS                      */
/* ================================================== */

/* -------- GET ranking factors only -------- */
export const handle_get_ranking_factors = async (req, res) => {
  try {
    const settings = await get_or_create_settings();

    return res.status(200).json({
      status: "success",
      message: "Ranking factors fetched successfully",
      data: settings.ranking_factors,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching ranking factors",
      error: error.message,
    });
  }
};

/* -------- EDIT ranking factors only -------- */
export const handle_edit_ranking_factors = async (req, res) => {
  try {
    const { ranking_factors } = req.body;

    if (!ranking_factors) {
      return res.status(400).json({
        status: "error",
        message: "ranking_factors is required",
      });
    }

    await get_or_create_settings();

    const updated_settings =
      await marketplace_search_settings_model.findOneAndUpdate(
        { singleton_key: "global" },
        { $set: { ranking_factors: JSON.parse(ranking_factors) } },
        { new: true },
      );

    return res.status(200).json({
      status: "success",
      message: "Ranking factors updated successfully",
      data: updated_settings.ranking_factors,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating ranking factors",
      error: error.message,
    });
  }
};

/* -------- RESET ranking factors to defaults -------- */
export const handle_reset_ranking_factors = async (req, res) => {
  try {
    await get_or_create_settings();

    const reset_settings =
      await marketplace_search_settings_model.findOneAndUpdate(
        { singleton_key: "global" },
        { $set: { ranking_factors: DEFAULT_SEARCH_SETTINGS.ranking_factors } },
        { new: true },
      );

    return res.status(200).json({
      status: "success",
      message: "Ranking factors reset to defaults successfully",
      data: reset_settings.ranking_factors,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while resetting ranking factors",
      error: error.message,
    });
  }
};

/* ================================================== */
/*             FILTER CONFIGURATION                   */
/* ================================================== */

/* -------- GET filter configuration only -------- */
export const handle_get_filter_configuration = async (req, res) => {
  try {
    const settings = await get_or_create_settings();

    return res.status(200).json({
      status: "success",
      message: "Filter configuration fetched successfully",
      data: settings.filter_configuration,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching filter configuration",
      error: error.message,
    });
  }
};

/* -------- EDIT filter configuration only -------- */
export const handle_edit_filter_configuration = async (req, res) => {
  try {
    const { filter_configuration } = req.body;

    if (!filter_configuration) {
      return res.status(400).json({
        status: "error",
        message: "filter_configuration is required",
      });
    }

    await get_or_create_settings();

    const updated_settings =
      await marketplace_search_settings_model.findOneAndUpdate(
        { singleton_key: "global" },
        { $set: { filter_configuration: JSON.parse(filter_configuration) } },
        { new: true },
      );

    return res.status(200).json({
      status: "success",
      message: "Filter configuration updated successfully",
      data: updated_settings.filter_configuration,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating filter configuration",
      error: error.message,
    });
  }
};
