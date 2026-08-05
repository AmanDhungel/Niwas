import mongoose from "mongoose";

const ram_schema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["scheduled", "recurring", "reported", "emergency"],
      required: true,
    },
    pipeline: {
      domain_workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "domain_workspace",
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    property: {
      type: String,
    },
    location: {
      type: String,
    },
    // vendor_workspace: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "vendor_workspace",
    //   required: true,
    // },
    // board: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "board",
    // },
    date: {
      type: Date,
    },
    time: {
      type: String,
    },
    estimated_duration: {
      type: String,
    },
    total_estimated_cost: {
      type: Number,
      default: 0,
    },
    cost_breakdown: {
      labor: {
        type: Number,
        default: 0,
      },
      materials: {
        type: Number,
        default: 0,
      },
      additional_charges: {
        type: Number,
        default: 0,
      },
    },
    tags: [
      {
        type: String,
      },
    ],
    internal_notes: {
      type: String,
    },
    attachments: [
      {
        type: String,
      },
    ],
    notify_affected_tenants: {
      type: Boolean,
      default: false,
    },
    require_approval_before_starting_work: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const ram_model = mongoose.model("ram", ram_schema);

export default ram_model;