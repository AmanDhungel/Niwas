import mongoose from "mongoose";

const sms_setting_schema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    provider: {
      type: String,
      enum: ["nestsms", "other"],
      unique: true,
      required: true,
    },
    api_key: {
      type: String,
      required: true,
    },
    api_key_masked: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const sms_setting_model = mongoose.model("sms_setting", sms_setting_schema);

export default sms_setting_model;
