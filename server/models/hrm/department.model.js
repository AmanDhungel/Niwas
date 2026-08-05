import mongoose from "mongoose";

const department_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // no_of_employees: {
    //   type: Number,
    //   default: 0,
    // },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

const department_model = mongoose.model("department", department_schema);

export default department_model;
