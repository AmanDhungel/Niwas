import mongoose from "mongoose";

const goal_schema = new mongoose.Schema(
  {
    goal_type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "goal_type",
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    target_achievement: {
      type: String,
      required: true,
      trim: true,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "completed", "canceled"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

const goal_model = mongoose.model("goal", goal_schema);

export default goal_model;
