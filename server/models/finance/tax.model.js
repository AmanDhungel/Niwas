import mongoose from "mongoose";

const tax_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const tax_model = mongoose.model("tax", tax_schema);

export default tax_model;
