import mongoose from "mongoose";

const testimonial_schema = new mongoose.Schema(
  {
    author: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      image: {
        key: {
          type: String,
          trim: true,
        },
        url: {
          type: String,
          trim: true,
        },
      },
    },
    role: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const testimonial_model = mongoose.model("testimonial", testimonial_schema);

export default testimonial_model;
