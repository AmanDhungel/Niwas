import mongoose from "mongoose";

const provident_fund_schema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      required: true,
    },
    type: {
      type: String,
      enum: ["employee_contribution", "employer_contribution"],
      required: true,
    },
    employee_share_percentage: {
      type: Number,
      required: true,
    },
    organization_share_percentage: {
      type: Number,
      required: true,
    },
    employee_share_amount: {
      type: Number,
      required: true,
    },
    organization_share_amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    }
  },
  {
    timestamps: true,
  },
);

const provident_fund_model = mongoose.model(
  "provident_fund",
  provident_fund_schema,
);

export default provident_fund_model;
