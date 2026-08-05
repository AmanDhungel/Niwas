import mongoose from "mongoose";

const training_type_schema = new mongoose.Schema(
  {
    type: {
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

const training_type_model = mongoose.model(
  "training_type",
  training_type_schema,
);

export default training_type_model;
