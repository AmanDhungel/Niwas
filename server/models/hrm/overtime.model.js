import mongoose from "mongoose";

const overtime_schema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      required: true,
    },
    project: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    overtime: {
      type: Number,
      required: true,
    },
    remaining_hours: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const overtime_model = mongoose.model("overtime", overtime_schema);

export default overtime_model;
