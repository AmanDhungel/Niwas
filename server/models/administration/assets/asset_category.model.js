import mongoose from "mongoose";

const asset_category_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

const asset_category_model = mongoose.model(
  "asset_category",
  asset_category_schema,
);

export default asset_category_model;
