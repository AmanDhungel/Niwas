import mongoose from "mongoose";

const goal_type_schema = new mongoose.Schema(
  {
    goal_type: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

const goal_type_model = mongoose.model("goal_type", goal_type_schema);

export default goal_type_model;
