import mongoose from "mongoose";

const lead_schema = new mongoose.Schema(
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
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "company",
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "contact",
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
    phone: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
    },
    industry: {
      type: String,
      enum: [
        "retail_industry",
        "banking_finance",
        "it_software",
        "healthcare",
        "manufacturing",
        "education",
      ],
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
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "contact",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    description: {
      type: String,
      trim: true,
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

const lead_model = mongoose.model("lead", lead_schema);

export default lead_model;
