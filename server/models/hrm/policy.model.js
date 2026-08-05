import mongoose from "mongoose";

const policy_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    appraisal_date: {
      type: Date,
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "department",
      required: true,
    },
    files: [
      {
        file: {
          type: String,
        },
        key: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const policy_model = mongoose.model("policy", policy_schema);

export default policy_model;
