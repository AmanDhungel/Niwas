import tenant_invitation_model from "../../models/tenant/tenant_invitation.model.js";

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

/* ================= GET ALL TENANT INVITATIONS ================= */
export const handle_get_tenant_invitations = async (req, res) => {
  try {
    const invitations = await tenant_invitation_model
      .find()
      .populate("property_and_unit.property");

    return res.status(200).json({
      status: "success",
      message: "Tenant invitations fetched successfully",
      data: invitations,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching tenant invitations",
      error: error.message,
    });
  }
};

/* ================= GET TENANT INVITATION BY ID ================= */
export const handle_get_tenant_invitation = async (req, res) => {
  try {
    const { invitation_id } = req.params;

    const invitation = await tenant_invitation_model
      .findById(invitation_id)
      .populate("property_and_unit.property");

    if (!invitation) {
      return res.status(404).json({
        status: "error",
        message: "Tenant invitation not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Tenant invitation fetched successfully",
      data: invitation,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching tenant invitation",
      error: error.message,
    });
  }
};

/* ================= ADD TENANT INVITATION ================= */
export const handle_add_tenant_invitation = async (req, res) => {
  try {
    const {
      basic_details,
      property_and_unit,
      lease_terms,
      invitation_setup,
    } = req.body;

    const rawPayload = {
      basic_details,
      property_and_unit,
      lease_terms,
      invitation_setup,
    };
    const cleanedPayload = sanitizePayload(rawPayload);

    const invitation = await tenant_invitation_model.create(cleanedPayload);

    return res.status(201).json({
      status: "success",
      message: "Tenant invitation added successfully",
      data: invitation,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding tenant invitation",
      error: error.message,
    });
  }
};

/* ================= EDIT TENANT INVITATION ================= */
export const handle_edit_tenant_invitation = async (req, res) => {
  try {
    const { invitation_id } = req.params;

    const invitation = await tenant_invitation_model.findById(invitation_id);
    if (!invitation) {
      return res.status(404).json({
        status: "error",
        message: "Tenant invitation not found",
      });
    }

    const {
      basic_details,
      property_and_unit,
      lease_terms,
      invitation_setup,
    } = req.body;

    const rawPayload = {
      basic_details,
      property_and_unit,
      lease_terms,
      invitation_setup,
    };
    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_invitation = await tenant_invitation_model.findByIdAndUpdate(
      invitation_id,
      { $set: cleanedPayload },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Tenant invitation updated successfully",
      data: updated_invitation,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating tenant invitation",
      error: error.message,
    });
  }
};

/* ================= DELETE TENANT INVITATION ================= */
export const handle_delete_tenant_invitation = async (req, res) => {
  try {
    const { invitation_id } = req.params;

    const deleted_invitation =
      await tenant_invitation_model.findByIdAndDelete(invitation_id);

    if (!deleted_invitation) {
      return res.status(404).json({
        status: "error",
        message: "Tenant invitation not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Tenant invitation deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting tenant invitation",
      error: error.message,
    });
  }
};
