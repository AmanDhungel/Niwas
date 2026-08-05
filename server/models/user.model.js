import mongoose from "mongoose";
import Joi from "joi";

const user_schema = new mongoose.Schema(
  {
    photo: {
      url: {
        type: String,
        trim: true,
      },
      key: {
        type: String,
        trim: true,
      },
    },
    user_name: {
      type: String,
      required: true,
      trim: true,
    },
    user_email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    user_phone: {
      type: String,
      trim: true,
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
    user_password: {
      type: String,
      required: true,
    },
    user_email_verified: {
      type: Boolean,
      default: false,
    },
    user_type: {
      type: String,
      enum: ["regular", "superuser", "ecommerce_user"],
      default: "regular",
    },
    ecommerce_user_type: {
      type: String,
      enum: ["customer", "agent"],
    },
    user_groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "group",
      },
    ],
    user_permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "permission",
      },
    ],
    user_permission_policies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "permission_policy",
      },
    ],
    is_deleted: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_suspended: {
      type: Boolean,
      default: false,
    },
    payment_methods: [
      {
        type: {
          type: String,
          enum: ["card", "bank_account", "paypal"],
          required: true,
        },
        card_type: {
          type: String,
          enum: ["visa", "mastercard", "amex", "discover"],
        },
        card_number: {
          type: String,
          length: 16,
        },
        card_last4: {
          type: String,
          length: 4,
        },
        card_exp_month: {
          type: Number,
          min: 1,
          max: 12,
        },
        card_exp_year: {
          type: Number,
          min: new Date().getFullYear(),
        },
        cvv: {
          type: String,
          length: 3,
        },
        bank_name: {
          type: String,
          trim: true,
        },
        bank_account_number: {
          type: String,
          trim: true,
        },
        bank_account_last4: {
          type: String,
          length: 4,
        },
        paypal_email: {
          type: String,
          trim: true,
        },
      },
    ],
    payment_preferences: {
      auto_pay: {
        type: Boolean,
        default: false,
      },
      save_payment_info: {
        type: Boolean,
        default: false,
      },
    },
    notification_preferences: {
      email_notifications: {
        type: Boolean,
        default: true,
      },
      sms_notifications: {
        type: Boolean,
        default: false,
      },
      property_alerts: {
        type: Boolean,
        default: true,
      },
      tour_reminders: {
        type: Boolean,
        default: true,
      },
      maintenance_updates: {
        type: Boolean,
        default: true,
      },
      marketing_emails: {
        type: Boolean,
        default: false,
      },
    },
    account_preferences: {
      language: {
        type: String,
        default: "English",
      },
      timezone: {
        type: String,
        default: "UTC",
      },
      currency: {
        type: String,
        default: "USD",
      },
      date_format: {
        type: String,
        default: "MM/DD/YYYY",
      },
      privacy_settings: {
        profile_visibility: {
          type: String,
          enum: ["public", "private", "friends"],
          default: "private",
        },
        show_activity_status: {
          type: Boolean,
          default: false,
        },
      },
    },
    saved_properties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "property",
      },
    ],
  },
  {
    timestamps: true,
  },
);

export const user_validation_schema = Joi.object({
  user_name: Joi.string().required().messages({
    "string.empty": "Please enter your name.",
    "any.required": "Please enter your name.",
  }),
  user_email: Joi.string().email().required().messages({
    "string.email": "Invalid email address provided.",
    "string.empty": "Please enter your email address.",
    "any.required": "Please enter your email address.",
  }),
  user_password: Joi.string().required().messages({
    "string.empty": "Please enter your password.",
    "any.required": "Please enter your password.",
  }),
});

const user_model = mongoose.model("user", user_schema);

export default user_model;
