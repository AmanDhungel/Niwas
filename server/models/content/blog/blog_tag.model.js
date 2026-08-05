import mongoose from "mongoose";

const blog_tag_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const blog_tag_model = mongoose.model("blog_tag", blog_tag_schema);

export default blog_tag_model;
