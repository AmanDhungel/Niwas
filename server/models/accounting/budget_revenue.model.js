import mongoose from "mongoose";

const budget_revenue_schema = new mongoose.Schema(
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
    revenue_date: {
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

const budget_revenue_model = mongoose.model(
  "budget_revenue",
  budget_revenue_schema,
);

export default budget_revenue_model;
