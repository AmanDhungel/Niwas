
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

// /* ================= GET ALL TENANT LEASES ================= */
export const handle_get_tenant_leases = async (req, res) => {
  try {

    const { tenant_id } = req.params;

    const leases = await tenant_lease_model.find({ tenant: tenant_id }).populate("existing_lease");

    return res.status(200).json({
      status: "success",
      message: "Tenant leases fetched successfully",
      data: leases,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching tenant leases",
      error: error.message,
    });
  }
};

/* ================= GET TENANT LEASE BY ID ================= */
export const handle_get_tenant_lease = async (req, res) => {
  try {
    const { lease_id, tenant_id } = req.params;

    const lease = await tenant_lease_model
      .findOne({
        _id: lease_id,
        tenant: tenant_id,
      })
      .populate("existing_lease");

    if (!lease) {
      return res.status(404).json({
        status: "error",
        message: "Tenant lease not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Tenant lease fetched successfully",
      data: lease,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching tenant lease",
      error: error.message,
    });
  }
};

/* ================= ADD TENANT LEASE ================= */
export const handle_add_tenant_lease = async (req, res) => {
  try {
    const { tenant, type, existing_lease, new_lease } = req.body;

    const rawPayload = {
      tenant,
      type,
      existing_lease,
      new_lease: JSON.parse(new_lease || "{}"),
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    // Guard: "existing" type requires existing_lease ref
    if (cleanedPayload.type === "existing" && !cleanedPayload.existing_lease) {
      return res.status(400).json({
        status: "error",
        message: "existing_lease is required when type is 'existing'",
      });
    }

    // Guard: "new" type requires new_lease object
    if (cleanedPayload.type === "new" && !cleanedPayload.new_lease) {
      return res.status(400).json({
        status: "error",
        message: "new_lease details are required when type is 'new'",
      });
    }

    const lease = await tenant_lease_model.create(cleanedPayload);

    return res.status(201).json({
      status: "success",
      message: "Tenant lease added successfully",
      data: lease,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding tenant lease",
      error: error.message,
    });
  }
};

/* ================= EDIT TENANT LEASE ================= */
export const handle_edit_tenant_lease = async (req, res) => {
  try {
    const { lease_id } = req.params;

    const lease = await tenant_lease_model.findById(lease_id);
    if (!lease) {
      return res.status(404).json({
        status: "error",
        message: "Tenant lease not found",
      });
    }

    const { tenant, type, existing_lease, new_lease } = req.body;

    const rawPayload = {
      tenant,
      type,
      existing_lease,
      new_lease: JSON.parse(new_lease || "{}"),
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_lease = await tenant_lease_model.findByIdAndUpdate(
      lease_id,
      { $set: cleanedPayload },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Tenant lease updated successfully",
      data: updated_lease,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating tenant lease",
      error: error.message,
    });
  }
};

/* ================= DELETE TENANT LEASE ================= */
export const handle_delete_tenant_lease = async (req, res) => {
  try {
    const { lease_id } = req.params;

    const deleted_lease = await tenant_lease_model.findByIdAndDelete(lease_id);

    if (!deleted_lease) {
      return res.status(404).json({
        status: "error",
        message: "Tenant lease not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Tenant lease deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting tenant lease",
      error: error.message,
    });
  }
};
