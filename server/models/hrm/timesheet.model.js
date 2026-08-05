import mongoose from "mongoose";

const timesheet_schema = new mongoose.Schema(
  {
    project: {
      type: String,
      required: true,
      trim: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    total_hours: {
      type: Number,
      required: true,
    },
    remaining_hours: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    hours: {
      type: Number,
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const timesheet_model = mongoose.model("timesheet", timesheet_schema);

export default timesheet_model;
