import mongoose from "mongoose";

const resignation_schema = new mongoose.Schema(
  {
    resigning_employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      required: true,
    },
    notice_date: {
      type: Date,
      required: true,
    },
    resignation_date: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approve_reject_date: {
      type: Date,
    },
    approver_rejector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    approved_rejected_notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const resignation_model = mongoose.model("resignation", resignation_schema);

export default resignation_model;
