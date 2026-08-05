import mongoose from "mongoose";

const permission_log_schema = new mongoose.Schema(
  {
    entity: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    performed_at: {
      type: Date,
      default: new Date(),
    },
    changes: [
      {
        previous_value: {
          type: mongoose.Schema.Types.Mixed,
        },
        new_value: {
          type: mongoose.Schema.Types.Mixed,
        },
        extra_info: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const permission_log_model = mongoose.model(
  "permission_log",
  permission_log_schema,
);

export default permission_log_model;
