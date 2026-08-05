import mongoose from "mongoose";

const invoice_schema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
      required: true,
    },
    property: {
      type: String,
      required: true,
    },
    details: {
      issued_date: {
        type: Date,
        required: true,
      },
      due_date: {
        type: Date,
        required: true,
      },
      period_start: {
        type: Date,
        required: true,
      },
      period_end: {
        type: Date,
        required: true,
      },
      payment_terms: {
        type: String,
        required: true,
      },
    },
    service_provider: {
      property_owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "owner",
      },
      name: {
        type: String,
      },
      address: {
        type: String,
      },
      phone: {
        type: String,
      },
      email: {
        type: String,
      },
    },
    bill_to: {
      name: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
    work_order_details: {
      category: {
        type: String,
        required: true,
      },
      priority: {
        type: String,
        required: true,
      },
      technician_name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      service_date: {
        type: Date,
        required: true,
      },
      completion_date: {
        type: Date,
        required: true,
      },
    },
    labor_charges: [
      {
        description: {
          type: String,
          required: true,
        },
        unit_price: {
          type: Number,
          required: true,
        },
        working_hours: {
          type: Number,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        technician_name: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          required: true,
        },
      },
    ],
    material_and_parts: [
      {
        description: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        unit_price: {
          type: Number,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tax",
    },
    tax_amount: {
      type: Number,
      required: true,
    },
    discount_amount: {
      type: Number,
      required: true,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    payment_information: {
      method: {
        type: String,
        required: true,
      },
    },
    additional_information: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["rent", "maintenance", "utility", "deposit", "lease", "other"],
      default: "other",
    },
    paid_date: {
      type: Date,
    },
    platform_held: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const invoice_model = mongoose.model("invoice", invoice_schema);

export default invoice_model;
