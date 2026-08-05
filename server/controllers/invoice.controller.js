import invoice_model from "../models/invoice.model.js";

export const handle_get_invoices = async (req, res) => {
  try {
    const invoices = await invoice_model.find().populate("contact");

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

export const handle_add_invoice = async (req, res) => {
  try {
    const {
      contact,
      invoice_date,
      due_date,
      items: raw_items,
      payment_method,
      status,
      note,
      discount = 0,
      tax = 0,
    } = req.body;

    if (!contact || !invoice_date || !payment_method) {
      return res.status(400).json({
        status: "error",
        message: "Missing required invoice fields",
      });
    }

    let items = raw_items;

    if (typeof raw_items === "string") {
      try {
        items = JSON.parse(raw_items);
      } catch {
        return res.status(400).json({
          status: "error",
          message: "Invalid items format",
        });
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Invoice must contain at least one item",
      });
    }

    const normalized_items = items.map((item) => {
      if (
        !item.description ||
        typeof item.quantity !== "number" ||
        typeof item.price !== "number"
      ) {
        throw new Error("Invalid invoice item");
      }

      const amount = item.quantity * item.price;

      return {
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        amount,
      };
    });

    const subtotal = normalized_items.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const total_amount = subtotal - Number(discount) + Number(tax);

    if (total_amount < 0) {
      return res.status(400).json({
        status: "error",
        message: "Invoice total cannot be negative",
      });
    }

    const last_invoice = await invoice_model
      .findOne()
      .sort({ createdAt: -1 })
      .select("invoice_number")
      .lean();

    let new_invoice_number = "INV-0001";

    if (last_invoice?.invoice_number) {
      const last_number = parseInt(
        last_invoice.invoice_number.split("-")[1],
        10
      );
      new_invoice_number = `INV-${String(last_number + 1).padStart(4, "0")}`;
    }

    const raw_payload = {
      invoice_number: new_invoice_number,
      contact,
      invoice_date,
      due_date,
      items: normalized_items,
      subtotal,
      discount,
      tax,
      amount: total_amount,
      payment_method,
      status,
      note,
    };

    const sanitized_payload = sanitizePayload(raw_payload);

    const invoice = await invoice_model.create(sanitized_payload);

    return res.status(201).json({
      status: "success",
      message: "Invoice added successfully",
      data: invoice,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding invoice",
      error: error.message,
    });
  }
};

export const handle_get_invoice = async (req, res) => {
  try {
    const { invoice_id } = req.params;

    const invoice = await invoice_model
      .findById(invoice_id)
      .populate("contact");

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
