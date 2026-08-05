import owner_invoice_model from "../../models/owner/owner_invoice.model.js";

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

/* ================= GET ALL OWNER INVOICES ================= */
export const handle_get_owner_invoices = async (req, res) => {
  try {
    const { owner_id } = req.params; // ✅ fixed: was req.query

    const invoices = await owner_invoice_model.find({ owner: owner_id });

    return res.status(200).json({
      status: "success",
      message: "Owner invoices fetched successfully",
      data: invoices,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching owner invoices",
      error: error.message,
    });
  }
};

/* ================= GET OWNER INVOICE BY ID ================= */
export const handle_get_owner_invoice = async (req, res) => {
  try {
    const { owner_id, invoice_id } = req.params;

    const invoice = await owner_invoice_model.findOne({
      _id: invoice_id,
      owner: owner_id,
    });

    if (!invoice) {
      return res.status(404).json({
        status: "error",
        message: "Owner invoice not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Owner invoice fetched successfully",
      data: invoice,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching owner invoice",
      error: error.message,
    });
  }
};

/* ================= ADD OWNER INVOICE ================= */
export const handle_add_owner_invoice = async (req, res) => {
  try {
    const { owner, invoice_type, amount, due_date, status, description } =
      req.body;

    const rawPayload = {
      owner,
      invoice_type,
      amount,
      due_date,
      status,
      description,
    };
    const cleanedPayload = sanitizePayload(rawPayload);

    const invoice = await owner_invoice_model.create(cleanedPayload);

    return res.status(201).json({
      status: "success",
      message: "Owner invoice added successfully",
      data: invoice,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding owner invoice",
      error: error.message,
    });
  }
};

/* ================= EDIT OWNER INVOICE ================= */
export const handle_edit_owner_invoice = async (req, res) => {
  try {
    const { invoice_id } = req.params;

    const invoice = await owner_invoice_model.findById(invoice_id);
    if (!invoice) {
      return res.status(404).json({
        status: "error",
        message: "Owner invoice not found",
      });
    }

    const { owner, invoice_type, amount, due_date, status, description } =
      req.body;

    const rawPayload = {
      owner,
      invoice_type,
      amount,
      due_date,
      status,
      description,
    };
    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_invoice = await owner_invoice_model.findByIdAndUpdate(
      invoice_id,
      { $set: cleanedPayload },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Owner invoice updated successfully",
      data: updated_invoice,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating owner invoice",
      error: error.message,
    });
  }
};

/* ================= DELETE OWNER INVOICE ================= */
export const handle_delete_owner_invoice = async (req, res) => {
  try {
    const { invoice_id } = req.params;

    const deleted_invoice =
      await owner_invoice_model.findByIdAndDelete(invoice_id);

    if (!deleted_invoice) {
      return res.status(404).json({
        status: "error",
        message: "Owner invoice not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Owner invoice deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting owner invoice",
      error: error.message,
    });
  }
};

/* ================= UPDATE INVOICE STATUS ================= */
export const handle_update_owner_invoice_status = async (req, res) => {
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

    const invoice = await owner_invoice_model.findByIdAndUpdate(
      invoice_id,
      { $set: { status } },
      { new: true },
    );

    if (!invoice) {
      return res.status(404).json({
        status: "error",
        message: "Owner invoice not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Owner invoice status updated successfully",
      data: { _id: invoice._id, status: invoice.status },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating owner invoice status",
      error: error.message,
    });
  }
};