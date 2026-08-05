import mongoose from "mongoose";

const domain_workspace_schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
    },
    image_key: {
      type: String,
    },
    icon: {
      type: String,
    },
    icon_key: {
      type: String,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    membership_restriction: {
      type: String,
      enum: ["open", "specific", "restricted"],
      default: "restricted",
    },
    board_deletion_restriction: {
      public_board_deletion: {
        type: String,
        enum: ["any_workspace_member", "only_workspace_admins", "nobody"],
        default: "only_workspace_admins",
      },
      visible_board_creation: {
        type: String,
        enum: ["any_workspace_member", "only_workspace_admins", "nobody"],
        default: "any_workspace_member",
      },
      private_board_creation: {
        type: String,
        enum: ["any_workspace_member", "only_workspace_admins", "nobody"],
        default: "only_workspace_admins",
      },
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
  },
);

const domain_workspace_model = mongoose.model(
  "domain_workspace",
  domain_workspace_schema,
);

export default domain_workspace_model;
