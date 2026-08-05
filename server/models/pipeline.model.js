import mongoose from "mongoose";

const pipeline_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    stages: [
      {
        label: {
          type: String,
          required: true,
        },
        index: {
          type: Number,
          required: true,
        },
      },
    ],
    access: {
      type: String,
      enum: ["all", "selected"],
      default: "all",
    },
    allowed_users: [
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

const pipeline_model = mongoose.model("pipeline", pipeline_schema);

export default pipeline_model;
