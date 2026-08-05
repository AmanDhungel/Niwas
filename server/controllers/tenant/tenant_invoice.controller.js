import tenant_model from "../../models/tenant/tenant.model.js";
import tenant_invoice_model from "../../models/tenant/tenant_invoice.model.js";

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

/* ================= GET ALL TENANT INVOICES ================= */
export const handle_get_tenant_invoices = async (req, res) => {
  try {
    const { tenant_id } = req.params;
    const invoices = await tenant_invoice_model.find({
      tenant: tenant_id,
    });

    return res.status(200).json({
      status: "success",
      message: "Tenant invoices fetched successfully",
      data: invoices,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching tenant invoices",
      error: error.message,
    });
  }
};

/* ================= GET TENANT INVOICE BY ID ================= */
export const handle_get_tenant_invoice = async (req, res) => {
  try {
    const { invoice_id, tenant_id } = req.params;

    const invoice = await tenant_invoice_model.findOne({
      _id: invoice_id,
      tenant: tenant_id,
    });

    if (!invoice) {
      return res.status(404).json({
        status: "error",
        message: "Tenant invoice not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Tenant invoice fetched successfully",
      data: invoice,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching tenant invoice",
      error: error.message,
    });
  }
};

/* ================= ADD TENANT INVOICE ================= */
export const handle_add_tenant_invoice = async (req, res) => {
  try {
    const { tenant, invoice_type, amount, due_date, status, description } =
      req.body;

    const existing_tenant = await tenant_model.findById(tenant);
    if (!existing_tenant) {
      return res.status(404).json({
        status: "error",
        message: "Tenant not found",
      });
    }

    const rawPayload = {
      tenant,
      invoice_type,
      amount,
      due_date,
      status,
      description,
    };
    const cleanedPayload = sanitizePayload(rawPayload);

    const invoice = await tenant_invoice_model.create(cleanedPayload);

    return res.status(201).json({
      status: "success",
      message: "Tenant invoice added successfully",
      data: invoice,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding tenant invoice",
      error: error.message,
    });
  }
};

/* ================= EDIT TENANT INVOICE ================= */
export const handle_edit_tenant_invoice = async (req, res) => {
  try {
    const { invoice_id } = req.params;

    const invoice = await tenant_invoice_model.findById(invoice_id);
    if (!invoice) {
      return res.status(404).json({
        status: "error",
        message: "Tenant invoice not found",
      });
    }

    const { tenant, invoice_type, amount, due_date, status, description } =
      req.body;

    const existing_tenant = await tenant_model.findById(tenant);
    if (!existing_tenant) {
      return res.status(404).json({
        status: "error",
        message: "Tenant not found",
      });
    }

    const rawPayload = {
      tenant,
      invoice_type,
      amount,
      due_date,
      status,
      description,
    };
    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_invoice = await tenant_invoice_model.findByIdAndUpdate(
      invoice_id,
      { $set: cleanedPayload },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Tenant invoice updated successfully",
      data: updated_invoice,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating tenant invoice",
      error: error.message,
    });
  }
};

/* ================= DELETE TENANT INVOICE ================= */
export const handle_delete_tenant_invoice = async (req, res) => {
  try {
    const { invoice_id } = req.params;

    const deleted_invoice =
      await tenant_invoice_model.findByIdAndDelete(invoice_id);

    if (!deleted_invoice) {
      return res.status(404).json({
        status: "error",
        message: "Tenant invoice not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Tenant invoice deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting tenant invoice",
      error: error.message,
    });
  }
};

/* ================= UPDATE INVOICE STATUS ================= */
export const handle_update_tenant_invoice_status = async (req, res) => {
  try {
    const { invoice_id } = req.params;
    const { status } = req.body;

    const allowed_statuses = ["pending", "paid", "overdue"];
    if (!status || !allowed_statuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status. Allowed values: ${allowed_statuses.join(", ")}`,
      });
    }

    const invoice = await tenant_invoice_model.findByIdAndUpdate(
      invoice_id,
      { $set: { status } },
      { new: true },
    );

    if (!invoice) {
      return res.status(404).json({
        status: "error",
        message: "Tenant invoice not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Tenant invoice status updated successfully",
      data: { _id: invoice._id, status: invoice.status },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating tenant invoice status",
      error: error.message,
    });
  }
};
