import utility_provider_model from "../../models/utility/utility_provider.model.js";

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
    if (!isEmptyValue(value)) cleaned[key] = value;
  }
  return cleaned;
};

/* ================= GET ALL UTILITY PROVIDERS ================= */
export const handle_get_utility_providers = async (req, res) => {
  try {
    const providers = await utility_provider_model.find();

    return res.status(200).json({
      status: "success",
      message: "Utility providers fetched successfully",
      data: providers,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching utility providers",
      error: error.message,
    });
  }
};

/* ================= GET UTILITY PROVIDER BY ID ================= */
export const handle_get_utility_provider = async (req, res) => {
  try {
    const { provider_id } = req.params;

    const provider = await utility_provider_model.findById(provider_id);

    if (!provider) {
      return res.status(404).json({
        status: "error",
        message: "Utility provider not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Utility provider fetched successfully",
      data: provider,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching utility provider",
      error: error.message,
    });
  }
};

/* ================= ADD UTILITY PROVIDER ================= */
export const handle_add_utility_provider = async (req, res) => {
  try {
    const {
      basic_info,
      contact_info,
      service_areas,
      payment_terms,
      service_metrics,
      billing_configuration,
      contract_details,
    } = req.body;

    const rawPayload = {
      basic_info: JSON.parse(basic_info || "{}"),
      contact_info: JSON.parse(contact_info || "{}"),
      service_areas: JSON.parse(service_areas || "[]"),
      payment_terms: JSON.parse(payment_terms || "{}"),
      service_metrics: JSON.parse(service_metrics || "{}"),
      billing_configuration: JSON.parse(billing_configuration || "{}"),
      contract_details: JSON.parse(contract_details || "{}"),
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const provider = await utility_provider_model.create({
      basic_info: cleanedPayload.basic_info || {},
      contact_info: cleanedPayload.contact_info || {},
      service_areas: cleanedPayload.service_areas || [],
      payment_terms: cleanedPayload.payment_terms || {},
      service_metrics: cleanedPayload.service_metrics || {},
      billing_configuration: cleanedPayload.billing_configuration || {},
      contract_details: cleanedPayload.contract_details || {},
    });

    return res.status(201).json({
      status: "success",
      message: "Utility provider added successfully",
      data: provider,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding utility provider",
      error: error.message,
    });
  }
};

/* ================= EDIT UTILITY PROVIDER ================= */
export const handle_edit_utility_provider = async (req, res) => {
  try {
    const { provider_id } = req.params;

    const provider = await utility_provider_model.findById(provider_id);
    if (!provider) {
      return res.status(404).json({
        status: "error",
        message: "Utility provider not found",
      });
    }

    const {
      basic_info,
      contact_info,
      service_areas,
      payment_terms,
      service_metrics,
      billing_configuration,
      contract_details,
    } = req.body;

    const rawPayload = {
      basic_info: JSON.parse(basic_info || "{}"),
      contact_info: JSON.parse(contact_info || "{}"),
      service_areas: JSON.parse(service_areas || "[]"),
      payment_terms: JSON.parse(payment_terms || "{}"),
      service_metrics: JSON.parse(service_metrics || "{}"),
      billing_configuration: JSON.parse(billing_configuration || "{}"),
      contract_details: JSON.parse(contract_details || "{}"),
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_provider = await utility_provider_model.findByIdAndUpdate(
      provider_id,
      { $set: cleanedPayload },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Utility provider updated successfully",
      data: updated_provider,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating utility provider",
      error: error.message,
    });
  }
};

/* ================= DELETE UTILITY PROVIDER ================= */
export const handle_delete_utility_provider = async (req, res) => {
  try {
    const { provider_id } = req.params;

    const deleted_provider =
      await utility_provider_model.findByIdAndDelete(provider_id);

    if (!deleted_provider) {
      return res.status(404).json({
        status: "error",
        message: "Utility provider not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Utility provider deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting utility provider",
      error: error.message,
    });
  }
};
