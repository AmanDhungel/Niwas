import mongoose from "mongoose";

const designation_schema = new mongoose.Schema(
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
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "department",
      required: true,
    },
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

const designation_model = mongoose.model("designation", designation_schema);

export default designation_model;
