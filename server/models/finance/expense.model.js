import mongoose from "mongoose";

const expense_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    payment_method: {
      type: String,
      required: true,
      enum: ["cash", "bank_transfer", "cheque", "credit_card", "other"],
    },
  },
  {
    timestamps: true,
  },
);

const expense_model = mongoose.model("expense", expense_schema);

export default expense_model;
