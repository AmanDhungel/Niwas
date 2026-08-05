import mongoose from "mongoose";

const blog_category_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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

const blog_category_model = mongoose.model(
  "blog_category",
  blog_category_schema,
);

export default blog_category_model;
