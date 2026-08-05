import mongoose from "mongoose";

const permission_module_schema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: true,
      trim: true,
    },
    module_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    permission_policies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "permission_policy",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  },
);

permission_module_schema.index(
  { module: 1, module_item_id: 1, user: 1 },
  { unique: true },
);

const permission_module_model = mongoose.model(
  "permission_module",
  permission_module_schema,
);

export default permission_module_model;