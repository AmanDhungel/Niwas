import mongoose from "mongoose";

const faq_schema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const faq_model = mongoose.model("faq", faq_schema);

export default faq_model;
