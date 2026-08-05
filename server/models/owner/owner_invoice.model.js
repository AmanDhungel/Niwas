import mongoose from "mongoose";

const owner_invoice_schema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "owner",
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

const owner_invoice_model = mongoose.model(
  "owner_invoice",
  owner_invoice_schema,
);

export default owner_invoice_model;
