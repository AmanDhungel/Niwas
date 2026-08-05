import mongoose from "mongoose";

const system_setting_schema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    otp: {
      type: {
        type: String,
        enum: ["email", "sms"],
        default: "email",
      },
      digit_limit: {
        type: Number,
        default: 6,
      },
      expiry_time: {
        type: Number,
        default: 10,
      },
    },
    gdpr_cookies: {
      consent_text: {
        type: String,
        default: "",
      },
      position: {
        type: String,
        enum: ["top", "bottom"],
        default: "bottom",
      },
      agree_button_text: {
        type: String,
        default: "I Agree",
      },
      decline_button_text: {
        type: String,
        default: "I Decline",
      },
      show_decline_button: {
        type: Boolean,
        default: false,
      },
      link: {
        type: String,
        default: "",
      },
    },
    maintenance_mode: {
      image: {
        key: {
          type: String,
        },
        url: {
          type: String,
        },
      },
      description: {
        type: String,
      },
      status: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  },
);

const system_setting_model = mongoose.model(
  "system_setting",
  system_setting_schema,
);

export default system_setting_model;
