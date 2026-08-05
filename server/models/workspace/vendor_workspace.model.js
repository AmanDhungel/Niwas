import mongoose from "mongoose";

const vendor_workspace_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "domain_workspace",
      required: true,
    },
    logo: {
      type: String,
    },
    logo_key: {
      type: String,
    },
    label_color: {
      type: String,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    assigned_users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const vendor_workspace_model = mongoose.model(
  "vendor_workspace",
  vendor_workspace_schema
);

export default vendor_workspace_model;
