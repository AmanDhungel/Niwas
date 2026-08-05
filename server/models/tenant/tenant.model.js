import mongoose from "mongoose";

const tenant_schema = new mongoose.Schema(
  {
    basic_info: {
      profile_image: {
        key: { type: String, required: true },
        url: { type: String, required: true },
      },
      first_name: {
        type: String,
        required: true,
      },
      last_name: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["individual", "organization"],
        required: true,
      },
      company_name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone_number: {
        type: String,
        required: true,
      },
      phone_number_2: {
        type: String,
      },
      fax: {
        type: String,
      },
      date_of_birth: {
        type: Date,
      },
      website: {
        type: String,
      },
      about: {
        type: String,
      },
      tags: [
        {
          type: String,
        },
      ],
      source: {
        type: String,
        enum: ["online", "referral", "walk-in", "advertisement", "other"],
        required: true,
      },
      ratings: {
        type: Number,
        default: 0,
      },
      industry: {
        type: String,
        required: true,
      },
      currency: {
        type: String,
        required: true,
      },
      language: {
        type: String,
        required: true,
      },
    },

    social_media: {
      facebook: {
        type: String,
      },
      twitter: {
        type: String,
      },
      linkedin: {
        type: String,
      },
      skype: {
        type: String,
      },
      whatsapp: {
        type: String,
      },
      instagram: {
        type: String,
      },
    },

    contact_info: {
      contact: {
        type: String,
      },
      emergency_contact_name: {
        type: String,
        required: true,
      },
      relationship: {
        type: String,
        required: true,
      },
      emergency_contact_phone: {
        type: String,
        required: true,
      },
    },

    address: {
      address: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      zipcode: {
        type: String,
        required: true,
      },
    },

    employment: {
      employer: {
        type: String,
        required: true,
      },
      job_title: {
        type: String,
        required: true,
      },
      income_range: {
        type: String,
        required: true,
      },
    },

    property_assignment: {
      property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "property",
      },
      unit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "property",
      },
      deals: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "deal",
      },
      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    },

    preferences: {
      tenant_status: {
        type: String,
        enum: ["applicant", "active", "inactive"],
        required: true,
      },
      pref_language: {
        type: String,
      },
      payment_method: {
        type: String,
        required: true,
      },
      auto_pay_enabled: {
        type: Boolean,
        default: false,
      },
      sublease_enabled: {
        type: Boolean,
        default: false,
      },
    },

    notifications: {
      email_notifications: {
        type: Boolean,
        default: true,
      },
      sms_notifications: {
        type: Boolean,
        default: false,
      },
      push_notifications: {
        type: Boolean,
        default: false,
      },
    },

    visibility_settings: {
      visibility: {
        type: String,
        enum: ["public", "private", "select_people"],
        default: "private",
      },
      selected_people: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
      ],
    },

    additional_notes: {
      type: String,
    },
    status: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const tenant_model = mongoose.model("tenant", tenant_schema);

export default tenant_model;
