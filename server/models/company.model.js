import mongoose from "mongoose";

const company_schema = new mongoose.Schema(
  {
    image: {
      key: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    secondary_phone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "contact",
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
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
    currency: {
      type: String,
      enum: ["USD", "NPR"],
      default: "NPR",
    },
    language: {
      type: String,
      enum: ["English", "Nepali"],
      default: "English",
    },
    about: {
      type: String,
      trim: true,
    },
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "contact",
      },
    ],
    address: {
      address: {
        type: String,
        trim: true,
        required: true,
      },
      country: {
        type: String,
        trim: true,
        required: true,
      },
      state: {
        type: String,
        trim: true,
        required: true,
      },
      city: {
        type: String,
        trim: true,
        required: true,
      },
      zip_code: {
        type: String,
        trim: true,
        required: true,
      },
    },
    social_accounts: {
      facebook: {
        type: String,
        trim: true,
      },
      twitter: {
        type: String,
        trim: true,
      },
      linkedin: {
        type: String,
        trim: true,
      },
      instagram: {
        type: String,
        trim: true,
      },
      whatsapp: {
        type: String,
        trim: true,
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
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

const company_model = mongoose.model("company", company_schema);

export default company_model;
