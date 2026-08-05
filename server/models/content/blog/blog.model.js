import mongoose from "mongoose";

const blog_schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    banner_image: {
      key: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "blog_category",
    },
    liked_by: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    comments: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "blog_comment",
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "blog_tag",
      },
    ],
  },
  {
    timestamps: true,
  },
);

const blog_model = mongoose.model("blog", blog_schema);

export default blog_model;
