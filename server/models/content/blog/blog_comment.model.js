import mongoose from "mongoose";

const blog_comment_schema = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    review: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "blog",
      required: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    status: {
      type: String,
      enum: ["published", "not_published"],
      default: "published",
    },
  },
  {
    timestamps: true,
  },
);

const blog_comment_model = mongoose.model("blog_comment", blog_comment_schema);

export default blog_comment_model;
