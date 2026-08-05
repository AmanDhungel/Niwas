import mongoose from "mongoose";

const promotion_schema = new mongoose.Schema(
  {
    promotion_for: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      required: true,
    },
    promotion_from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "designation",
      required: true,
    },
    promotion_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "designation",
      required: true,
    },
    promotion_date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const promotion_model = mongoose.model("promotion", promotion_schema);

export default promotion_model;
