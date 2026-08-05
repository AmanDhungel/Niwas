import mongoose from "mongoose";

const activity_schema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    activity_type: {
      type: String,
      enum: ["call", "meeting", "email", "task"],
      required: true,
    },
    call_duration: {
      type: Number,
      min: 0,
    },
    due_date: {
      type: Date,
      required: true,
    },
    activity_time: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "contact",
    },
    guests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "contact",
      },
    ],
    deals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "deal",
      },
    ],
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "contact",
      },
    ],
    companies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "company",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const activity_model = mongoose.model("activity", activity_schema);

export default activity_model;
