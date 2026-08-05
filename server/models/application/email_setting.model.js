import mongoose from "mongoose";

const email_setting_schema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    identifier: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    port: {
      type: Number,
      required: true,
    },
    host: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const email_setting_model = mongoose.model("email_setting", email_setting_schema);

export default email_setting_model;
