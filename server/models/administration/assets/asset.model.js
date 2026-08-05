import mongoose from "mongoose";

const asset_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "asset_category",
    },
    purchase_date: {
      type: Date,
    },
    purchased_from: {
      type: String,
      trim: true,
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    serial_number: {
      type: String,
      trim: true,
    },
    model: {
      type: String,
      trim: true,
    },
    warranty: {
      type: Date,
      trim: true,
    },
    asset_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    status: {
      type: String,
      required: true,
      enum: ["in_use", "available", "under_maintenance", "retired"],
      default: "available",
    },
  },
  {
    timestamps: true,
  },
);

const asset_model = mongoose.model("asset", asset_schema);

export default asset_model;
