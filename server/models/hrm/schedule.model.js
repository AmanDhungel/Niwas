import mongoose from "mongoose";

const schedule_schema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "department",
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    shift: {
      type: String,
      enum: ["morning", "afternoon", "night"],
      required: true,
    },
    min_start_time: {
      type: String,
      required: true,
    },
    start_time: {
      type: String,
      required: true,
    },
    max_start_time: {
      type: String,
      required: true,
    },
    min_end_time: {
      type: String,
      required: true,
    },
    end_time: {
      type: String,
      required: true,
    },
    max_end_time: {
      type: String,
      required: true,
    },
    break_time: {
      type: String,
      required: true,
    },
    accept_extra_hours: {
      type: Boolean,
      default: false,
    },
    publish: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const schedule_model = mongoose.model("schedule", schedule_schema);

export default schedule_model;
