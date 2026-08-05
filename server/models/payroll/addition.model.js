import mongoose from "mongoose";

const addition_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    unit_calculation: {
      type: Boolean,
      required: true,
      default: false,
    },
    assigned_type: {
      type: String,
      required: true,
      enum: ["no_assignee", "all_employees", "selected_employees"],
    },
    assigned_employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employee",
      },
    ],
  },
  {
    timestamps: true,
  },
);

const addition_model = mongoose.model("addition", addition_schema);

export default addition_model;
