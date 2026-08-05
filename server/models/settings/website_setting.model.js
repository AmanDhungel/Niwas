import mongoose from "mongoose";

const website_setting_schema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    business_settings: {
      company_name: {
        type: String,
        trim: true,
      },
      email_address: {
        type: String,
        trim: true,
      },
      phone_number: {
        type: String,
        trim: true,
      },
      fax: {
        type: String,
        trim: true,
      },
      website_url: {
        type: String,
        trim: true,
      },
      company_images: {
        white_logo: {
          url: {
            type: String,
            trim: true,
          },
          key: {
            type: String,
            trim: true,
          },
        },
        dark_logo: {
          url: {
            type: String,
            trim: true,
          },
          key: {
            type: String,
            trim: true,
          },
        },
        white_mini_logo: {
          url: {
            type: String,
            trim: true,
          },
          key: {
            type: String,
            trim: true,
          },
        },
        dark_mini_logo: {
          url: {
            type: String,
            trim: true,
          },
          key: {
            type: String,
            trim: true,
          },
        },
        favicon: {
          url: {
            type: String,
            trim: true,
          },
          key: {
            type: String,
            trim: true,
          },
        },
        apple_touch_icon: {
          url: {
            type: String,
            trim: true,
          },
          key: {
            type: String,
            trim: true,
          },
        },
      },
      address: {
        address_line: {
          type: String,
        },
        country: {
          type: String,
        },
        state: {
          type: String,
        },
        city: {
          type: String,
        },
        postal_code: {
          type: String,
        },
      },
    },
    seo_settings: {
      meta_title: {
        type: String,
        trim: true,
      },
      meta_description: {
        type: String,
        trim: true,
      },
      meta_keywords: {
        type: String,
        trim: true,
      },
      canonical_url: {
        type: String,
        trim: true,
      },
      og_title: {
        type: String,
        trim: true,
      },
      og_description: {
        type: String,
        trim: true,
      },
      og_image: {
        url: {
          type: String,
          trim: true,
        },
        key: {
          type: String,
          trim: true,
        },
      },
    },
    localization: {
      language: {
        type: String,
        trim: true,
      },
      timezone: {
        type: String,
        trim: true,
      },
      language_switcher: {
        enabled: {
          type: Boolean,
          default: false,
        },
      },
      date_format: {
        type: String,
        trim: true,
      },
      time_format: {
        type: String,
        trim: true,
      },
      financial_year: {
        type: String,
      },
      starting_month: {
        type: String,
      },
      currency: {
        type: String,
      },
      currency_symbol: {
        type: String,
      },
      currency_position: {
        type: String,
        enum: ["before", "after"],
      },
      decimal_separator: {
        type: String,
      },
      thousand_separator: {
        type: String,
      },
      countries_restriction: {
        type: [String],
      },
      allowed_files: {
        type: [String],
      },
      max_file_size: {
        type: Number,
      },
    },
    prefixes: {
      employee: {
        type: String,
        default: "EMP",
      },
      invoice: {
        type: String,
        default: "INV",
      },
      candidate: {
        type: String,
        default: "CAND",
      },
      referral: {
        type: String,
        default: "REF",
      },
      clients: {
        type: String,
        default: "CLI",
      },
      tickets: {
        type: String,
        default: "TIC",
      },
      job: {
        type: String,
        default: "JOB",
      },
      assets: {
        type: String,
        default: "AST",
      },
    },
    preferences: {
      employees: {
        type: Boolean,
        default: true,
      },
      contacts: {
        type: Boolean,
        default: true,
      },
      leads: {
        type: Boolean,
        default: true,
      },
      sales: {
        type: Boolean,
        default: true,
      },
      clients: {
        type: Boolean,
        default: true,
      },
      companies: {
        type: Boolean,
        default: true,
      },
      pipelines: {
        type: Boolean,
        default: true,
      },
      accounting: {
        type: Boolean,
        default: true,
      },
      projects: {
        type: Boolean,
        default: true,
      },
      deals: {
        type: Boolean,
        default: true,
      },
      activities: {
        type: Boolean,
        default: true,
      },
      reports: {
        type: Boolean,
        default: true,
      },
    },
    appearance: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "light",
      },
      accent_color: {
        type: String,
        trim: true,
      },
      sidebar_size: {
        type: String,
        enum: ["small", "medium", "large"],
        default: "medium",
      },
      font_family: {
        type: String,
        trim: true,
      },
    },
    authentication_settings: {
      allow_registration: {
        enabled: {
          type: Boolean,
          default: false,
        },
        invite_only: {
          type: Boolean,
          default: false,
        },
      },
      verification_required: {
        type: Boolean,
        default: true,
      },
      verification_expired: {
        type: String,
      },
      referral_system: {
        enabled: {
          type: Boolean,
          default: false,
        },
      },
      login_type: {
        type: String,
        enum: ["email", "phone"],
        default: "email",
      },
      password: {
        type: Boolean,
        default: true,
      },
      otp_system: {
        enabled: {
          type: Boolean,
          default: false,
        },
        otp_type: {
          type: String,
          enum: ["email", "sms"],
          default: "email",
        },
      },
    },
    ai_settings: {
      openai_api_key: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

const website_setting_model = mongoose.model(
  "website_setting",
  website_setting_schema,
);

export default website_setting_model;
