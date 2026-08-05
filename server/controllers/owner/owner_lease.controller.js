import owner_lease_model from "../../models/owner/owner_lease.model.js";

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

/* ================= GET ALL OWNER LEASES ================= */
export const handle_get_owner_leases = async (req, res) => {
  try {
    const { owner_id } = req.params;
    const leases = await owner_lease_model
      .find({
        owner: owner_id,
      })
      .populate("existing_lease");

    return res.status(200).json({
      status: "success",
      message: "Owner leases fetched successfully",
      data: leases,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching owner leases",
      error: error.message,
    });
  }
};

/* ================= GET OWNER LEASE BY ID ================= */
export const handle_get_owner_lease = async (req, res) => {
  try {
    const { lease_id, owner_id } = req.params;

    const lease = await owner_lease_model
      .findOne({
        _id: lease_id,
        owner: owner_id,
      })
      .populate("existing_lease");

    if (!lease) {
      return res.status(404).json({
        status: "error",
        message: "Owner lease not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Owner lease fetched successfully",
      data: lease,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching owner lease",
      error: error.message,
    });
  }
};

/* ================= ADD OWNER LEASE ================= */
export const handle_add_owner_lease = async (req, res) => {
  try {
    const { owner, type, existing_lease, new_lease } = req.body;

    const rawPayload = {
      owner,
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

    const lease = await owner_lease_model.create(cleanedPayload);

    return res.status(201).json({
      status: "success",
      message: "Owner lease added successfully",
      data: lease,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding owner lease",
      error: error.message,
    });
  }
};

/* ================= EDIT OWNER LEASE ================= */
export const handle_edit_owner_lease = async (req, res) => {
  try {
    const { lease_id } = req.params;

    const lease = await owner_lease_model.findById(lease_id);
    if (!lease) {
      return res.status(404).json({
        status: "error",
        message: "Owner lease not found",
      });
    }

    const { owner, type, existing_lease, new_lease } = req.body;

    const rawPayload = {
      owner,
      type,
      existing_lease,
      new_lease,
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_lease = await owner_lease_model.findByIdAndUpdate(
      lease_id,
      { $set: cleanedPayload },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Owner lease updated successfully",
      data: updated_lease,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating owner lease",
      error: error.message,
    });
  }
};

/* ================= DELETE OWNER LEASE ================= */
export const handle_delete_owner_lease = async (req, res) => {
  try {
    const { lease_id } = req.params;

    const deleted_lease = await owner_lease_model.findByIdAndDelete(lease_id);

    if (!deleted_lease) {
      return res.status(404).json({
        status: "error",
        message: "Owner lease not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Owner lease deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting owner lease",
      error: error.message,
    });
  }
};
