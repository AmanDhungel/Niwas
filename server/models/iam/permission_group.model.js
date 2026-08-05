import mongoose from "mongoose";

const permission_group_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    permission_policies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "permission_policy",
      },
    ],
    users: [
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

const permission_group_model = mongoose.model(
  "permission_group",
  permission_group_schema,
);

export default permission_group_model;
