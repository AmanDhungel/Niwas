import mongoose from "mongoose";

const deal_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
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
    status: {
      type: String,
      enum: ["open", "won", "lost"],
      default: "open",
    },
    value: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ["USD", "NPR"],
      default: "NPR",
    },
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "contact",
      },
    ],
    due_date: {
      type: Date,
      required: true,
    },
    expected_close_date: {
      type: Date,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    followup_date: {
      type: Date,
    },
    source: {
      type: String,
      enum: [
        "phone_call",
        "social_media",
        "referral",
        "previous_contact",
        "other",
      ],
      default: "other",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    description: {
      type: String,
    },
    notes: [
      {
        title: {
          type: String,
          trim: true,
        },
        note: {
          type: String,
          trim: true,
        },
        attachments: [
          {
            file: {
              type: String,
            },
            key: {
              type: String,
            },
          },
        ],
      },
    ],
    calls: [
      {
        status: {
          type: String,
          enum: ["busy", "connected", "no_answer", "wrong_number"],
        },
        follow_up_date: {
          type: Date,
        },
        note: {
          type: String,
          trim: true,
        },
        create_follow_up_task: {
          type: Boolean,
          default: false,
        },
      },
    ],
    activity_log: [
      {
        entity: {
          type: String,
        },
        action: {
          type: String,
        },
        performed_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        performed_at: {
          type: Date,
          default: new Date(),
        },
        changes: [
          {
            previous_value: {
              type: mongoose.Schema.Types.Mixed,
            },
            new_value: {
              type: mongoose.Schema.Types.Mixed,
            },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  },
);

const deal_model = mongoose.model("deal", deal_schema);

export default deal_model;
