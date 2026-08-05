import invoice_model from "../../models/finance/invoice.model.js";

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

export const handle_get_invoices = async (req, res) => {
  try {
    const invoices = await invoice_model.find().populate("tax");

    return res.status(200).json({
      status: "success",
      message: "Invoices fetched successfully",
      data: invoices,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching invoices",
      error: error.message,
    });
  }
};

export const handle_get_invoice = async (req, res) => {
  try {
    const { invoice_id } = req.params;

    const invoice = await invoice_model.findById(invoice_id).populate("tax");
    if (!invoice) {
      return res.status(404).json({
        status: "error",
        message: "Invoice not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Invoice fetched successfully",
      data: invoice,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching invoice",
      error: error.message,
    });
  }
};

export const handle_add_invoice = async (req, res) => {
  try {
    const {
      tenant,
      property,
      details,
      service_provider,
      bill_to,
      work_order_details,
      labor_charges,
      material_and_parts,
      subtotal,
      tax,
      tax_amount,
      discount_amount,
      total_amount,
      payment_information,
      additional_information,
    } = req.body;

    const rawPayload = {
      tenant,
      property,
      details: JSON.parse(details || "{}"),
      service_provider: JSON.parse(service_provider || "{}"),
      bill_to: JSON.parse(bill_to || "{}"),
      work_order_details: JSON.parse(work_order_details || "{}"),
      labor_charges: JSON.parse(labor_charges || "{}"),
      material_and_parts: JSON.parse(material_and_parts || "{}"),
      subtotal,
      tax,
      tax_amount,
      discount_amount,
      total_amount,
      payment_information: JSON.parse(payment_information || "{}"),
      additional_information,
    };

    const payload = sanitizePayload(rawPayload);

    const new_invoice = await invoice_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Invoice added successfully",
      data: new_invoice,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding invoice",
      error: error.message,
    });
  }
};

export const handle_edit_invoice = async (req, res) => {
  try {
    const { invoice_id } = req.params;
    const {
      tenant,
      property,
      details,
      service_provider,
      bill_to,
      work_order_details,
      labor_charges,
      material_and_parts,
      subtotal,
      tax,
      tax_amount,
      discount_amount,
      total_amount,
      payment_information,
      additional_information,
    } = req.body;

    const rawPayload = {
      tenant,
      property,
      details: JSON.parse(details || "{}"),
      service_provider: JSON.parse(service_provider || "{}"),
      bill_to: JSON.parse(bill_to || "{}"),
      work_order_details: JSON.parse(work_order_details || "{}"),
      labor_charges: JSON.parse(labor_charges || "{}"),
      material_and_parts: JSON.parse(material_and_parts || "{}"),
      subtotal,
      tax,
      tax_amount,
      discount_amount,
      total_amount,
      payment_information: JSON.parse(payment_information || "{}"),
      additional_information,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_invoice = await invoice_model.findByIdAndUpdate(
      invoice_id,
      payload,
      {
        new: true,
      },
    );

    if (!updated_invoice) {
      return res.status(404).json({
        status: "error",
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Invoice updated successfully",
      data: updated_invoice,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating invoice",
      error: error.message,
    });
  }
};

export const handle_delete_invoice = async (req, res) => {
  try {
    const { invoice_id } = req.params;

    const deleted_invoice = await invoice_model.findByIdAndDelete(invoice_id);

    if (!deleted_invoice) {
      return res.status(404).json({
        status: "error",
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting invoice",
      error: error.message,
    });
  }
};

export const handle_mark_invoice_as_paid = async (req, res) => {
  try {
    const { invoice_id } = req.params;

    const updated_invoice = await invoice_model.findByIdAndUpdate(
      invoice_id,
      {
        status: "paid",
        paid_date: new Date(),
      },
      {
        new: true,
      },
    );

    if (!updated_invoice) {
      return res.status(404).json({
        status: "error",
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Invoice marked as paid successfully",
      data: updated_invoice,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while marking invoice as paid",
      error: error.message,
    });
  }
};

export const handle_get_invoice_payments = async (req, res) => {
  try {
    const invoices = await invoice_model
      .find({ status: { $ne: "other" } })
      .populate("tax");

    return res.status(200).json({
      status: "success",
      message: "Payments fetched successfully",
      data: invoices,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching payments",
      error: error.message,
    });
  }
};

export const handle_get_invoice_escrows = async (req, res) => {
  try {
    const escrows = await invoice_model
      .find({ status: { $ne: "other" }, platform_held: true })
      .populate("tax");

    return res.status(200).json({
      status: "success",
      message: "Escrows fetched successfully",
      data: escrows,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching escrows",
      error: error.message,
    });
  }
};

export const handle_get_invoice_accounts = async (req, res) => {
  try {
    const invoices = await invoice_model
      .find({ status: { $ne: "other" } })
      .populate("tax")
      .populate("service_provider.property_owner");

    const accountsMap = {};

    for (const invoice of invoices) {
      const has_owner = !!invoice.service_provider?.property_owner;

      const group_key = has_owner
        ? invoice.service_provider.property_owner._id.toString()
        : invoice.service_provider?.name || "Unknown";

      if (!accountsMap[group_key]) {
        accountsMap[group_key] = {
          service_provider: has_owner
            ? invoice.service_provider.property_owner  // full owner object
            : invoice.service_provider?.name || "Unknown",
          invoices: [],
          received: 0,
          escrowed: 0,
          pending: 0,
          properties: new Set(),
        };
      }

      accountsMap[group_key].invoices.push(invoice);

      if (invoice.status === "paid") {
        if (invoice.platform_held) {
          accountsMap[group_key].escrowed += invoice.total_amount || 0;
        } else {
          accountsMap[group_key].received += invoice.total_amount || 0;
        }
      } else {
        accountsMap[group_key].pending += invoice.total_amount || 0;
      }

      /* -------- Properties (only for owner-based groups) -------- */
      // if (has_owner && invoice.property) {
      //   accountsMap[group_key].properties.add(invoice.property.toString());
      // }
    }

    // /* -------- Fetch total properties per owner from DB -------- */
    // for (const [key, account] of Object.entries(accountsMap)) {
    //   const is_owner_group =
    //     account.service_provider &&
    //     typeof account.service_provider === "object";

    //   if (is_owner_group) {
    //     const owner_id = account.service_provider._id;
    //     const property_ids = await property_model
    //       .find({ owner: owner_id })
    //       .distinct("_id");

    //     property_ids.forEach((id) =>
    //       account.properties.add(id.toString()),
    //     );
    //   }
    // }

    const accounts = Object.values(accountsMap).map((account) => ({
      service_provider: account.service_provider,
      invoices: account.invoices,
      received: account.received,
      escrowed: account.escrowed,
      pending: account.pending,
    }));

    return res.status(200).json({
      status: "success",
      message: "Accounts fetched successfully",
      data: accounts,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching accounts",
      error: error.message,
    });
  }
};