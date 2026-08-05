import mongoose from "mongoose";

const complaint_schema = new mongoose.Schema(
  {
    /* ================= PROPERTY & UNIT ================= */
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "property",
      required: true,
    },

    /* ================= SUBMITTED BY ================= */
    submitted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    /* ================= COMPLAINT DETAILS ================= */
    category: {
      type: String,
      required: true,
      enum: [
        "plumbing",
        "electrical",
        "hvac",
        "appliance",
        "structural",
        "pest_control",
        "cleaning",
        "security",
        "noise",
        "internet_cable",
        "other",
      ],
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
    priority: {
      type: String,
      required: true,
      enum: ["emergency", "high", "medium", "low"],
      default: "medium",
    },
    issue_title: {
      type: String,
      required: true,
    },
    detailed_description: {
      type: String,
      required: true,
    },
    preferred_contact_time: {
      type: String,
    },

    /* ================= ATTACHMENTS ================= */
    attachments: {
      photos: [{ type: String }],
      videos: [{ type: String }],
      audios: [{ type: String }],
      documents: [{ type: String }],
    },

    /* ================= STATUS & RESOLUTION ================= */
    complaint_status: {
      type: String,
      enum: ["new", "active", "resolved", "closed", "cancelled"],
      default: "new",
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    resolution_notes: {
      type: String,
    },
    resolved_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const complaint_model = mongoose.model("complaint", complaint_schema);

export default complaint_model;
