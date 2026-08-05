import mongoose from "mongoose";

const ticket_schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    pipeline: {
      domain_workspace: {
        type: mongoose.Schema.Types.ObjectId,
      },
      vendor_workspace: {
        type: mongoose.Schema.Types.ObjectId,
      },
      board: {
        type: mongoose.Schema.Types.ObjectId,
      },
      tasklist: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    event_category: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    due_date: {
      type: Date,
    },
    expected_closing_date: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    comments: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true,
        },
        comment: {
          type: String,
        },
        created_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        created_at: {
          type: Date,
          default: new Date(),
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const ticket_model = mongoose.model("ticket", ticket_schema);

export default ticket_model;
