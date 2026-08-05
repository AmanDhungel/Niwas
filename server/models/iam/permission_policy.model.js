import mongoose from "mongoose";

const permission_policy_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    policy: {
      type: String,
      trim: true,
      required: true,
    },
    type: {
      type: String,
      enum: ["allow", "deny"],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const permission_policy_model = mongoose.model(
  "permission_policy",
  permission_policy_schema,
);

export default permission_policy_model;
