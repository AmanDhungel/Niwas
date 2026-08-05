import workorder_vendor_model from "../../models/workorder/workorder_vendor.model.js";

const isEmptyValue = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (value instanceof Date) return false;
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

/* ================= GET ALL VENDORS ================= */
export const handle_get_workorder_vendors = async (req, res) => {
  try {
    const vendors = await workorder_vendor_model.find({});

    return res.status(200).json({
      status: "success",
      message: "Workorder vendors fetched successfully",
      data: vendors,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching workorder vendors",
      error: error.message,
    });
  }
};

/* ================= GET VENDOR BY ID ================= */
export const handle_get_workorder_vendor = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    const vendor = await workorder_vendor_model.findOne({
      _id: vendor_id,
    });

    if (!vendor) {
      return res.status(404).json({
        status: "error",
        message: "Workorder vendor not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Workorder vendor fetched successfully",
      data: vendor,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching workorder vendor",
      error: error.message,
    });
  }
};

/* ================= ADD VENDOR ================= */
export const handle_add_workorder_vendor = async (req, res) => {
  try {
    const {
      business_name,
      contact_name,
      phone_number,
      email_address,
      business_address,
      license_number,
      license_expiration_date,
      insurance_provider,
      coverage_amount,
      insurance_expiration_date,
      domain_workspace,
      service_areas,
      emergency_service_available,
      hourly_rate,
      minimum_charge,
      emergency_multiplier,
      specializations,
      certifications,
      contract_start_date,
      contract_end_date,
      payment_terms,
      scope_of_work,
      document_status,
      preferred_vendor,
      last_review_date,
      next_review_date,
      status,
    } = req.body;

    const rawPayload = {
      business_name,
      contact_name,
      phone_number,
      email_address,
      business_address,
      license_number,
      license_expiration_date,
      insurance_provider,
      coverage_amount,
      insurance_expiration_date,
      domain_workspace,
      service_areas,
      emergency_service_available,
      hourly_rate,
      minimum_charge,
      emergency_multiplier,
      specializations,
      certifications,
      contract_start_date,
      contract_end_date,
      payment_terms,
      scope_of_work,
      document_status,
      preferred_vendor,
      last_review_date,
      next_review_date,
      status,
    };
    const cleanedPayload = sanitizePayload(rawPayload);

    const vendor = await workorder_vendor_model.create(cleanedPayload);

    return res.status(201).json({
      status: "success",
      message: "Workorder vendor added successfully",
      data: vendor,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding workorder vendor",
      error: error.message,
    });
  }
};

/* ================= EDIT VENDOR ================= */
export const handle_edit_workorder_vendor = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    const vendor = await workorder_vendor_model.findById(vendor_id);
    if (!vendor) {
      return res.status(404).json({
        status: "error",
        message: "Workorder vendor not found",
      });
    }

    const {
      business_name,
      contact_name,
      phone_number,
      email_address,
      business_address,
      license_number,
      license_expiration_date,
      insurance_provider,
      coverage_amount,
      insurance_expiration_date,
      domain_workspace,
      service_areas,
      emergency_service_available,
      hourly_rate,
      minimum_charge,
      emergency_multiplier,
      specializations,
      certifications,
      contract_start_date,
      contract_end_date,
      payment_terms,
      scope_of_work,
      document_status,
      preferred_vendor,
      last_review_date,
      next_review_date,
      status,
    } = req.body;

    const rawPayload = {
      business_name,
      contact_name,
      phone_number,
      email_address,
      business_address,
      license_number,
      license_expiration_date,
      insurance_provider,
      coverage_amount,
      insurance_expiration_date,
      domain_workspace,
      service_areas,
      emergency_service_available,
      hourly_rate,
      minimum_charge,
      emergency_multiplier,
      specializations,
      certifications,
      contract_start_date,
      contract_end_date,
      payment_terms,
      scope_of_work,
      document_status,
      preferred_vendor,
      last_review_date,
      next_review_date,
      status,
    };
    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_vendor = await workorder_vendor_model.findByIdAndUpdate(
      vendor_id,
      { $set: cleanedPayload },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Workorder vendor updated successfully",
      data: updated_vendor,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating workorder vendor",
      error: error.message,
    });
  }
};

/* ================= DELETE VENDOR ================= */
export const handle_delete_workorder_vendor = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    const deleted_vendor =
      await workorder_vendor_model.findByIdAndDelete(vendor_id);

    if (!deleted_vendor) {
      return res.status(404).json({
        status: "error",
        message: "Workorder vendor not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Workorder vendor deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting workorder vendor",
      error: error.message,
    });
  }
};

/* ================= UPDATE VENDOR STATUS ================= */
export const handle_update_workorder_vendor_status = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { status } = req.body;

    const allowed_statuses = ["active", "inactive", "pending", "suspended"];
    if (!status || !allowed_statuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status. Allowed values: ${allowed_statuses.join(", ")}`,
      });
    }

    const vendor = await workorder_vendor_model.findByIdAndUpdate(
      vendor_id,
      { $set: { status } },
      { new: true },
    );

    if (!vendor) {
      return res.status(404).json({
        status: "error",
        message: "Workorder vendor not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Workorder vendor status updated successfully",
      data: { _id: vendor._id, status: vendor.status },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating workorder vendor status",
      error: error.message,
    });
  }
};

/* ================= TOGGLE PREFERRED VENDOR ================= */
export const handle_toggle_preferred_vendor = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    const vendor = await workorder_vendor_model.findById(vendor_id);
    if (!vendor) {
      return res.status(404).json({
        status: "error",
        message: "Workorder vendor not found",
      });
    }

    const updated_vendor = await workorder_vendor_model.findByIdAndUpdate(
      vendor_id,
      { $set: { preferred_vendor: !vendor.preferred_vendor } },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: `Vendor ${updated_vendor.preferred_vendor ? "marked as" : "removed from"} preferred successfully`,
      data: {
        _id: updated_vendor._id,
        preferred_vendor: updated_vendor.preferred_vendor,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while toggling preferred vendor",
      error: error.message,
    });
  }
};

/* ================= UPDATE DOCUMENT STATUS ================= */
export const handle_update_document_status = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { document_status } = req.body;

    if (!document_status || typeof document_status !== "object") {
      return res.status(400).json({
        status: "error",
        message: "document_status object is required",
      });
    }

    const allowed_keys = [
      "license_document",
      "insurance_certificate",
      "w9_form",
      "signed_contract",
    ];

    const updates = {};
    for (const key of allowed_keys) {
      if (typeof document_status[key] === "boolean") {
        updates[`document_status.${key}`] = document_status[key];
      }
    }

    const vendor = await workorder_vendor_model.findByIdAndUpdate(
      vendor_id,
      { $set: updates },
      { new: true },
    );

    if (!vendor) {
      return res.status(404).json({
        status: "error",
        message: "Workorder vendor not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Document status updated successfully",
      data: { _id: vendor._id, document_status: vendor.document_status },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating document status",
      error: error.message,
    });
  }
};
