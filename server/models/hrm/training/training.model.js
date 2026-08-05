import mongoose from "mongoose";

const training_schema = new mongoose.Schema(
  {
    training_type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "training_type",
      required: true,
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "trainer",
      required: true,
    },
    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employee",
      },
    ],
    training_cost: {
      type: Number,
      required: true,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "canceled"],
      default: "scheduled",
    },
  },
  {
    timestamps: true,
  },
);

const training_model = mongoose.model("training", training_schema);

export default training_model;
