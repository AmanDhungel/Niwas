import mongoose from "mongoose";

const timeline_schema = new mongoose.Schema(
  {
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "board",
      required: true,
    },
    task_list: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "in_progress", "completed", "canceled"],
      default: "scheduled",
    },
    date: {
      type: Date,
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "contact",
      },
    ],
    description: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        url: { type: String, required: true },
        key: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const timeline_model = mongoose.model("timeline", timeline_schema);

export default timeline_model;
