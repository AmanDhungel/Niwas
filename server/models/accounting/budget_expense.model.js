import mongoose from "mongoose";

const budget_expense_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category_name: {
      type: String,
      required: true,
    },
    sub_category_name: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    expense_date: {
      type: Date,
      required: true,
    },
    attachments: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

const budget_expense_model = mongoose.model(
  "budget_expense",
  budget_expense_schema,
);

export default budget_expense_model;