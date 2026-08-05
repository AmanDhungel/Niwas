import mongoose from "mongoose";

const budget_schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    respect_type: {
      type: String,
      required: true,
      enum: ["project", "category"],
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    expected_revenues: [
      {
        title: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    overall_revenue: {
      type: Number,
      required: true,
    },
    expected_expenses: [
      {
        title: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    overall_expense: {
      type: Number,
      required: true,
    },
    expected_profit: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    budget_amount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const budget_model = mongoose.model("budget", budget_schema);

export default budget_model;
