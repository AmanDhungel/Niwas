import mongoose from "mongoose";

const contact_schema = new mongoose.Schema(
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
    job_title: {
      type: String,
      trim: true,
    },
    // company: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "company",
    // },
    company: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      required: true,
    },
    secondary_phone: {
      type: String,
      trim: true,
    },
    date_of_birth: {
      type: Date,
    },
    rating: {
      type: String,
      enum: ["1", "2", "3", "4", "5"],
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
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
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
    files: [
      {
        title: {
          type: String,
          trim: true,
        },
        deal: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "deal",
        },
        document_type: {
          type: String,
          trim: true,
        },
        owner: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        username: {
          type: String,
          trim: true,
        },
        email: {
          type: String,
          trim: true,
        },
        password: {
          type: String,
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
          enum: ["active", "inactive"],
          default: "active",
        },
        signature: {
          type: String,
          enum: ["no_signature", "electronic_signature"],
        },
        content: {
          type: String,
        },
        document_signers: [
          {
            type: String,
          },
        ],
        message_subject: {
          type: String,
          trim: true,
        },
        message_text: {
          type: String,
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

const contact_model = mongoose.model("contact", contact_schema);

export default contact_model;
