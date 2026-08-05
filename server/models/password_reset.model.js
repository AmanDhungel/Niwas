import mongoose from "mongoose";

const password_reset_schema = new mongoose.Schema(
  {
    user_id: {
      ref: "user",
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reset_token: {
      type: String,
      required: true,
    },
    expires_at: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Auto-delete expired reset tokens.
password_reset_schema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const password_reset_model = mongoose.model(
  "password_reset",
  password_reset_schema,
);

export default password_reset_model;
