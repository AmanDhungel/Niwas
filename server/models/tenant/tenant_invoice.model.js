import mongoose from "mongoose";

const tenant_invoice_schema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
      required: true,
    },
    invoice_type: {
      type: String,
      enum: ["rent_due", "security_deposit", "payment"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    due_date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const tenant_invoice_model = mongoose.model(
  "tenant_invoice",
  tenant_invoice_schema,
);

export default tenant_invoice_model;
