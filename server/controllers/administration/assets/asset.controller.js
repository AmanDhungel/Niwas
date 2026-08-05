import asset_model from "../../../models/administration/assets/asset.model.js";
import asset_category_model from "../../../models/administration/assets/asset_category.model.js";

const isEmptyValue = (value) => {
  if (value === undefined || value === null) return true;

  if (typeof value === "string") {
    return value.trim() === "";
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "object") {
    return Object.keys(value).length === 0;
  }

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

export const handle_get_asset_categories = async (req, res) => {
  try {
    const asset_categories = await asset_category_model.find();

    return res.status(200).json({
      status: "success",
      message: "Asset categories fetched successfully",
      data: asset_categories,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching asset categories",
      error: error.message,
    });
  }
};

export const handle_get_asset_category = async (req, res) => {
  try {
    const { category_id } = req.params;

    const asset_category =
      await asset_category_model.findById(category_id);
    if (!asset_category) {
      return res.status(404).json({
        status: "error",
        message: "Asset category not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Asset category fetched successfully",
      data: asset_category,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching asset category",
      error: error.message,
    });
  }
};

export const handle_add_asset_category = async (req, res) => {
  try {
    const { name, status } = req.body;

    const rawPayload = {
      name,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const new_asset_category = await asset_category_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Asset category added successfully",
      data: new_asset_category,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding asset category",
      error: error.message,
    });
  }
};

export const handle_edit_asset_category = async (req, res) => {
  try {
    const { category_id } = req.params;
    const { name, status } = req.body;

    const rawPayload = {
      name,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_asset_category = await asset_category_model.findByIdAndUpdate(
      category_id,
      payload,
      { new: true },
    );

    if (!updated_asset_category) {
      return res.status(404).json({
        status: "error",
        message: "Asset category not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Asset category updated successfully",
      data: updated_asset_category,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating asset category",
      error: error.message,
    });
  }
};

export const handle_delete_asset_category = async (req, res) => {
  try {
    const { category_id } = req.params;

    const deleted_asset_category =
      await asset_category_model.findByIdAndDelete(category_id);

    if (!deleted_asset_category) {
      return res.status(404).json({
        status: "error",
        message: "Asset category not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Asset category deleted successfully",
      data: deleted_asset_category,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting asset category",
      error: error.message,
    });
  }
};

export const handle_get_assets = async (req, res) => {
  try {
    const assets = await asset_model
      .find()
      .populate("category")
      .populate("asset_user");

    return res.status(200).json({
      status: "success",
      message: "Assets fetched successfully",
      data: assets,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching assets",
      error: error.message,
    });
  }
};

export const handle_get_asset = async (req, res) => {
  try {
    const { asset_id } = req.params;

    const asset = await asset_model
      .findById(asset_id)
      .populate("category")
      .populate("asset_user");

    if (!asset) {
      return res.status(404).json({
        status: "error",
        message: "Asset not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Asset fetched successfully",
      data: asset,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching asset",
      error: error.message,
    });
  }
};

export const handle_delete_asset = async (req, res) => {
  try {
    const { asset_id } = req.params;

    const deleted_asset = await asset_model.findByIdAndDelete(asset_id);

    if (!deleted_asset) {
      return res.status(404).json({
        status: "error",
        message: "Asset not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Asset deleted successfully",
      data: deleted_asset,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting asset",
      error: error.message,
    });
  }
};

export const handle_add_asset = async (req, res) => {
  try {
    const {
      name,
      category,
      purchase_date,
      purchased_from,
      manufacturer,
      serial_number,
      model,
      warranty,
      asset_user,
      status,
    } = req.body;

    const new_asset = new asset_model({
      name,
      category,
      purchase_date,
      purchased_from,
      manufacturer,
      serial_number,
      model,
      warranty,
      asset_user,
      status,
    });

    await new_asset.save();

    return res.status(201).json({
      status: "success",
      message: "Asset added successfully",
      data: new_asset,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding asset",
      error: error.message,
    });
  }
};

export const handle_edit_asset = async (req, res) => {
  try {
    const { asset_id } = req.params;
    const {
      name,
      category,
      purchase_date,
      purchased_from,
      manufacturer,
      serial_number,
      model,
      warranty,
      asset_user,
      status,
    } = req.body;

    const rawPayload = {
      name,
      category,
      purchase_date,
      purchased_from,
      manufacturer,
      serial_number,
      model,
      warranty,
      asset_user,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_asset = await asset_model.findByIdAndUpdate(
      asset_id,
      payload,
      { new: true },
    );

    if (!updated_asset) {
      return res.status(404).json({
        status: "error",
        message: "Asset not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Asset updated successfully",
      data: updated_asset,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating asset",
      error: error.message,
    });
  }
};