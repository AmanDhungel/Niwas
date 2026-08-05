import mongoose from "mongoose";

const termination_schema = new mongoose.Schema(
  {
    terminated_employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      required: true,
    },
    termination_type: {
      type: String,
      enum: ["voluntary", "involuntary"],
      required: true,
    },
    notice_date: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    termination_date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const termination_model = mongoose.model("termination", termination_schema);

export default termination_model;
